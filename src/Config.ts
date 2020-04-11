import { Options, ILogger, ConfigSchema, IFlattenedKeys, Source, ILoader, IResolver } from './types';
import { ConfigLoader } from './utils/ConfigLoader';
import { Logger } from './utils/Logger';
import { SchemaNotFoundError, UninitialisedError, UndefinedConfigKeyError } from './errors';
import { ConfigValidator } from './utils/ConfigValidator';
import { ConfigValue } from './ConfigValue';
import { ConfigStore } from './ConfigStore';
import { Resolver } from './utils/Resolver';
import { EnvironmentLoader } from './loaders/EnvironmentLoader';
import { SSMLoader } from './loaders/SSMLoader';

export class Config<T> {
  private configLoader: ConfigLoader;
  private configValidator: ConfigValidator;
  private logger: ILogger;
  private schema!: ConfigSchema<T>;
  private flattenedKeys: IFlattenedKeys = {};
  private store!: ConfigStore;
  private loaderResolver: IResolver<ILoader>;

  constructor(options: Options.IConfigOptions = {}) {
    this.logger = options.logger ?? new Logger();

    this.loaderResolver = options.loaderResolver ?? new Resolver<ILoader>({
      logger: this.logger.spawn('LoaderResolver'),
      registered: {
        // Default loaders
        [Source.Environment]: EnvironmentLoader,
        [Source.SSM]: SSMLoader
      },
      // Pass through a retrieval function so the loader can resolve it's own config
      configRetriever: async (loader: string) => {
        return this.get(`loaders.${loader}`, {})
      },
    });
    this.configLoader = new ConfigLoader({
      logger: this.logger.spawn('ConfigLoader'),
      directory: options.configDirectory,
      loaderResolver: this.loaderResolver
    });
    this.configValidator = new ConfigValidator({
      logger: this.logger.spawn('ConfigValidator'),
    });
  }

  private getEnvironment(): string {
    return process.env.NODE_ENV ?? 'dev';
  }

  public isInitialised(): boolean {
    return !!this.schema;
  }

  private validateInitialised(): boolean {
    if (!this.isInitialised()) {
      throw new UninitialisedError();
    }
    return true;
  }

  /**
   * Flatten the store keys recursively to make lookups quicker
   * @param schema 
   */
  private flattenKeys(store: ConfigStore, parent: string = ''): IFlattenedKeys {
    let keys: IFlattenedKeys = {};
    store.each((key: string, value: ConfigStore | ConfigValue) => {
      const namespacedKey = !parent ? key : `${parent}.${key}`;
      keys[namespacedKey] = value;

      // Recursively build flattened keys from store
      if (value instanceof ConfigStore) {
        keys = {
          ...keys,
          ...this.flattenKeys(value, namespacedKey)
        };
      }
    });

    return keys;
  }

  /**
   * Set config key values (partial or full), will deep merge
   *
   * @param config 
   * @param keyNamespace 
   */
  private setConfig<C>(config: Partial<C>, keyNamespace: string = '') {
    for (const key in config) {
      if (!config.hasOwnProperty(key)) {
        continue;
      }

      const namespacedKey = !keyNamespace ? key : `${keyNamespace}.${key}`;

      // If not nested, set, otherwise call recursively to set
      const flattenedValue = this.flattenedKeys[namespacedKey]
      if (flattenedValue instanceof ConfigValue) {
        flattenedValue.setDefault(config[key]);
      } else {
        this.setConfig(config[key], namespacedKey);
      }
    }
  }

  /**
   * Generate a store tree from thge passed schema
   * @param schema 
   */
  private generateStore(schema: ConfigSchema<T>): void {
    this.store = new ConfigStore({
      schema,
      logger: this.logger.spawn('ConfigStore'),
      loader: this.configLoader,
      validator: this.configValidator
    });
  }

  /**
   * Initialise the config with the passed schema
   * This will do some processing and try to load the environment specific config file & validate
   *
   * @param schema 
   */
  public async initialise(schema: ConfigSchema<T>): Promise<void> {
    if (this.isInitialised()) {
      this.logger.info('Already initialised');
      return;
    }

    const environment = this.getEnvironment();
    this.logger.debug(`Initialising with environment ${environment}`);
    this.schema = schema;

    // Generate a nested store from the schema
    this.generateStore(this.schema);

    // Flatten the keys for easy access later on
    this.flattenedKeys = this.flattenKeys(this.store);

    if (environment) {
      this.logger.debug(`Loading environment config`);
      let environmentConfig: Partial<T>;
      try {
        environmentConfig = await this.configLoader.load(`${environment}.json`);
        await this.configValidator.validateFull<T>(this.schema, environmentConfig);

        this.setConfig(environmentConfig);
      } catch (e) {
        // Swallow SchemaNotFoundError's, re throw anything else
        if (!(e instanceof SchemaNotFoundError)) {
          throw e;
        }
        this.logger.info(`Failed to load / validate schema`);
      }
    }
  }

  /**
   * Does the key exist in the schema?
   * @param key 
   */
  public has(key: string): boolean {
    this.validateInitialised();

    return key in this.flattenedKeys;
  }

  /**
   * Get the value for the schema
   * TODO: Convert to 2 methods with type override
   * @param key 
   */
  public async get<C>(key: string, defaultValue?: any): Promise<C> {
    if (!this.has(key)) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new UndefinedConfigKeyError(key);
    }

    const flattenedKeyValue = this.flattenedKeys[key];

    // If we have a config value we need to go one level up to it's store
    // This is because it's store knows how to resolve it, it can't resolve itself
    if (flattenedKeyValue instanceof ConfigValue) {
      const segments = key.split('.');
      const lastSegment = segments.pop();

      // If we don't have a last segment then the parent store is the root one
      let store: ConfigStore;
      if (segments.length === 0) {
        store = this.store;
      } else {
        const parentKey = segments.join('.');
        const parentStore = this.flattenedKeys[parentKey];

        if (!(parentStore instanceof ConfigStore)) {
          this.logger.error('Failure to get parent store');
          throw new Error('Failure to get parent store');
        }
        store = parentStore;
      }

      return store.getValueForKey(lastSegment);
    }

    return flattenedKeyValue.getValue() as Promise<C>;
  }

  /**
   * Pass through method to add aloader on the resolver
   *
   * @param key 
   * @param loader 
   */
  addLoader(key: string, loader: ILoader): void {
    this.loaderResolver.add(key, loader);
  }
}