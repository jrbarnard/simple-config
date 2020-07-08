import merge from 'lodash.merge';
import { Logger } from './utils/Logger';
import { ConfigValue } from './ConfigValue';
import { ConfigStore } from './ConfigStore';
import { Resolver } from './utils/Resolver';
import { isConfigSchema } from './utils/guards';
import { SSMLoader } from './loaders/SSMLoader';
import { FileLoader } from './loaders/FileLoader';
import { ConfigLoader } from './utils/ConfigLoader';
import { ConfigValidator } from './utils/ConfigValidator';
import { EnvironmentLoader } from './loaders/EnvironmentLoader';
import { UndefinedConfigKeyError, ValueNotSetError } from './errors';
import { Options, ILogger, ConfigSchema, IFlattenedKeys, Source, ILoader, IResolver, ChainableSchema, ChainableSchemaValue } from './types';

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
        return this.get(`loaders.${loader}`, {});
      },
    });
    this.configValidator = new ConfigValidator({
      logger: this.logger.spawn('ConfigValidator'),
    });
    this.configLoader = new ConfigLoader({
      logger: this.logger.spawn('ConfigLoader'),
      loaderResolver: this.loaderResolver,
      validator: this.configValidator
    });

    this.schema = merge({
      loaders: {
        env: {},
        ssm: {},
      }
    }, schema);
    this.generateStore(this.schema);
    this.flattenedKeys = this.flattenKeys(this.store);
  }

  /**
   * Flatten the store keys recursively to make lookups quicker
   * @param store
   * @param parent
   */
  private flattenKeys(store: ConfigStore, parent = ''): IFlattenedKeys {
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
  private setConfig<C>(config: Partial<C>, keyNamespace = '') {
    for (const key in config) {
      const namespacedKey = !keyNamespace ? key : `${keyNamespace}.${key}`;

      // If not nested, set, otherwise call recursively to set
      const flattenedValue = this.flattenedKeys[namespacedKey];
      if (flattenedValue === undefined) {
        throw new Error(`Failed to set config for key: "${namespacedKey}", does not exist in schema`);
      }

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
      logger: this.logger.spawn('ConfigStore')
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
  public async loadConfigFile(file: string, configDirectory = 'config'): Promise<Config<T>> {
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
   * Validate config requested is defined in the schema
   * @param key 
   */
  private validateHas(key: string): true {
    if (!this.has(key)) {
      throw new UndefinedConfigKeyError(key);
    }
    return true;
  }

  /**
   * Get the value for the schema
   * @param key 
   */
  public async get<C>(key: string, defaultValue?: C): Promise<C> {
    this.validateHas(key);

    const valueStore = this.flattenedKeys[key];

    // Attempt to the load into the value store if not yet loaded / cached
    if (!valueStore.hasBeenSet()) {
      await this.configLoader.load(key, valueStore);
    }

    if (valueStore.hasBeenSet()) {
      return valueStore.getValue();
    }

    // Handle defaults if no value set during loading
    this.logger.debug(`There is no set value for ${key}, retrieving default`);
    if (defaultValue !== undefined) {
      this.logger.debug(`Returning runtime default: ${defaultValue}`);
      return defaultValue;
    }

    if (!(valueStore instanceof ConfigValue) || !valueStore.hasDefaultBeenSet()) {
      this.logger.debug(`No value set for ${key} and no default provided`);
      throw new ValueNotSetError(`No value set for ${key} and no default provided`);
    }

    return valueStore.getValue();
  }

  /**
   * Pass through method to add aloader on the resolver
   *
   * @param key 
   * @param loader 
   */
  public addLoader(key: string, loader: ILoader): this {
    this.loaderResolver.add(key, loader);
    return this;
  }

  /**
   * Clear the stored config values
   */
  public clear(): this {
    for (const key in this.flattenedKeys) {
      this.flattenedKeys[key].unset();
    }
    return this;
  }

  /**
   * Build a chainable config getter
   * NB: The types used & the casting is required due to the use of Object.defineProperties etc.
   * This allows for users to get type hinting when using
   */
  public get chain(): ChainableSchema<T> {
    /* eslint @typescript-eslint/no-this-alias: 0 */
    /* eslint @typescript-eslint/no-empty-function: 0 */
    this.logger.debug('Starting a config chain');
    const config = this;

    const chain = {} as ChainableSchema<T>;

    const buildChainItem = <CS, P extends keyof CS>(key: P, obj: ConfigSchema<CS>): ChainableSchemaValue<CS[P]> => {
      return {
        get() {
          if (!this._chain) {
            this._chain = [];
          }
  
          const chainer = () => {
            return config.get<CS[P]>(this._chain.join('.'));
          };
  
          // If nested continue the chain
          const objValue = obj[key];
          if (isConfigSchema(objValue)) {
            Object.defineProperties(chainer, buildChain(objValue));
          }
  
          // Pass the chain down
          this._chain.push(key);
          chainer._chain = this._chain;
  
          return chainer;
        }
      } as ChainableSchemaValue<CS[P]>;
    };
    const buildChain = <CS>(obj: ConfigSchema<CS>): ChainableSchema<CS> => {
      const chainable = {} as ChainableSchema<CS>;
      for (const key in obj) {
        chainable[key] = buildChainItem(key, obj);
      }
      return chainable;
    };

    Object.defineProperties(chain, buildChain(this.schema));

    return chain;
  }
}