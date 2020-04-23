import { Options, ILogger, ConfigSchema, IFlattenedKeys, Source, ILoader, IResolver, IObject } from './types';
import { ConfigLoader } from './utils/ConfigLoader';
import { Logger } from './utils/Logger';
import { UninitialisedError, UndefinedConfigKeyError, FileNotFoundError } from './errors';
import { ConfigValidator } from './utils/ConfigValidator';
import { ConfigValue } from './ConfigValue';
import { ConfigStore } from './ConfigStore';
import { Resolver } from './utils/Resolver';
import { EnvironmentLoader } from './loaders/EnvironmentLoader';
import { SSMLoader } from './loaders/SSMLoader';
import { FileLoader } from './loaders/FileLoader';

export class Config<T> {
  private configLoader: ConfigLoader;
  private configValidator: ConfigValidator;
  private logger: ILogger;
  private schema!: ConfigSchema<T>;
  private flattenedKeys: IFlattenedKeys = {};
  private store!: ConfigStore;
  private loaderResolver: IResolver<ILoader>;
  private environment?: string | undefined;
  private configDirectory: string;

  constructor(options: Options.IConfigOptions = {}) {
    this.logger = options.logger ?? new Logger();
    this.environment = options.environment ?? process.env.NODE_ENV;
    this.configDirectory = options.configDirectory ?? 'config';

    this.loaderResolver = new Resolver<ILoader>({
      logger: this.logger.spawn('LoaderResolver'),
      registered: {
        // Default loaders
        [Source.Environment]: EnvironmentLoader,
        [Source.SSM]: SSMLoader,
      },
      // Pass through a retrieval function so the loader can resolve it's own config
      configRetriever: async (loader: string) => {
        return this.get(`loaders.${loader}`, {})
      },
    });
    this.configLoader = new ConfigLoader({
      logger: this.logger.spawn('ConfigLoader'),
      loaderResolver: this.loaderResolver
    });
    this.configValidator = new ConfigValidator({
      logger: this.logger.spawn('ConfigValidator'),
    });
  }

  private getEnvironment(): string | undefined {
    return this.environment;
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
   * This sets the default values of the config
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
   * Generate a store tree from the passed schema
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
   * Loads and sets config from  the currently set environment file
   */
  private async loadEnvironmentFileConfig() {
    const environment = this.getEnvironment();

    if (environment) {
      this.logger.debug(`Loading environment config`);

      // Set up the file loader so we can retrieve the environment file
      this.addLoader(Source.EnvFile, new FileLoader({
        logger: this.logger,
        path: `${this.configDirectory}/${environment}.json`
      }));

      let environmentConfig: IObject;
      try {
        environmentConfig = await this.configLoader.loadFromSource(Source.EnvFile, '*');
        await this.configValidator.validate<T>(this.schema, environmentConfig as T);

        this.setConfig(environmentConfig);
      } catch (e) {
        // Swallow SchemaNotFoundError's, re throw anything else
        if (!(e instanceof FileNotFoundError)) {
          throw e;
        }

        this.logger.info(`Failed to load schema`);
      }
    }
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

    // Generate a nested store from the schema
    this.schema = schema;
    this.generateStore(this.schema);

    // Flatten the keys for easy access later on
    this.flattenedKeys = this.flattenKeys(this.store);

    // Load the environment file config upfront, this will merge on top of the defaults
    this.loadEnvironmentFileConfig();
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
   * @param key 
   */
  public async get<C>(key: string, defaultValue?: C): Promise<C> {
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
          this.logger.error(`Failure to get parent store under key - ${parentKey}`);
          throw new Error(`Failure to get parent store under key - ${parentKey}`);
        }
        store = parentStore;
      }

      return store.getValueForKey(lastSegment);
    }

    return flattenedKeyValue.getValue();
  }

  /**
   * Pass through method to add aloader on the resolver
   *
   * @param key 
   * @param loader 
   */
  public addLoader(key: string, loader: ILoader): void {
    this.loaderResolver.add(key, loader);
  }
}