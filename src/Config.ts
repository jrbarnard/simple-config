import { Options, ILogger, ConfigSchema, IFlattenedKeys, Source, ILoader, IResolver } from './types';
import { ConfigLoader } from './utils/ConfigLoader';
import { Logger } from './utils/Logger';
import { UndefinedConfigKeyError, FileNotFoundError } from './errors';
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
  private schema: ConfigSchema<T>;
  private flattenedKeys: IFlattenedKeys;
  private store!: ConfigStore;
  private loaderResolver: IResolver<ILoader>;

  /**
   * 
   * @param schema 
   * @param options 
   */
  constructor(schema: ConfigSchema<T>, options: Options.IConfigOptions = {}) {
    this.logger = options.logger ?? new Logger();

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
    
    this.schema = schema;
    this.generateStore(this.schema);
    this.flattenedKeys = this.flattenKeys(this.store);
  }

  /**
   * Flatten the store keys recursively to make lookups quicker
   * @param store
   * @param parent
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
   * Load a specific json file
   *
   * The file name (not including .json)
   * @param file
   * 
   * Optional
   * The config directory to load them from
   * @param configDirectory
   */
  public async loadConfigFile(file: string, configDirectory: string = 'config'): Promise<Config<T>> {
    this.logger.debug(`Loading environment config`);

    this.addLoader(Source.EnvFile, new FileLoader({
      logger: this.logger.spawn('FileLoader'),
      path: `${configDirectory}/${file}.json`
    }));

    // Load the entire file and then validate it against the schema
    const config = await this.configLoader.loadFromSource(Source.EnvFile, '*');
    await this.configValidator.validate<T>(this.schema, config as T);

    // Merge the loaded config on top of currently loaded
    this.setConfig(config);

    return this;
  }

  /**
   * Does the key exist in the schema?
   * @param key 
   */
  public has(key: string): boolean {
    return key in this.flattenedKeys;
  }

  /**
   * Get the value for the schema
   * @param key 
   */
  public async get<C>(key: string, defaultValue?: C): Promise<C> {
    if (!this.has(key)) {
      // TODO: Should still throw
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new UndefinedConfigKeyError(key);
    }

    // TODO: Wrap in try catch and pass back default if set
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