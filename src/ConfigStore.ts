import { ConfigSchema, ILogger, Options, IConfigLoader, IConfigSchemaObj, IConfigValidator } from './types';
import { ConfigValue } from './ConfigValue';
import { InvalidSchemaError, KeyLoadingError } from './errors';
import { isConfigSchemaObject } from './utils/guards';

interface IConfigStoreStore {
  [k: string]: ConfigStore | ConfigValue;
};

interface IMappedStore {
  [k: string]: any;
};

export class ConfigStore {
  private store: IConfigStoreStore = {};
  private schema: ConfigSchema<any>;
  private logger: ILogger;
  private loader: IConfigLoader;
  private validator: IConfigValidator;

  constructor(options: Options.IConfigStoreOptions) {
    this.logger = options.logger;
    this.schema = options.schema;
    this.loader = options.loader;
    this.validator = options.validator;
    this.generateFromSchema(this.schema);
  }

  /**
   * Generates the store tree from the passed schema
   * @param schema 
   */
  private generateFromSchema(schema: ConfigSchema<any>) {
    const store: any = {};

    for (const key in schema) {
      if (!schema.hasOwnProperty(key)) {
        continue;
      }

      let value: ConfigValue | ConfigStore;
      if (isConfigSchemaObject(schema[key])) {
        value = new ConfigValue();

        if ('_default' in schema[key]) {
          value.setDefault(schema[key]._default);
        }
      } else {
        value = new ConfigStore({
          schema: schema[key] as ConfigSchema<any>,
          logger: this.logger.spawn(`ConfigStore[${key}]`),
          loader: this.loader,
          validator: this.validator
        });
      }

      store[key] = value;
    }

    this.store = store;
  }

  /**
   * Cleans up the store value into an object literal
   * If some of the values haven't yet been retrieved it will retrieve them
   */
  public async getValue(): Promise<any> {
    const mapped: IMappedStore = {};
    for (const key in this.store) {
      if (!this.store.hasOwnProperty(key)) {
        continue;
      }

      mapped[key] = await this.getValueForKey(key);
    }

    return mapped;
  }

  /**
   * Get the value for a specific key in the store
   * Load if is not already
   * @param key 
   */
  public async getValueForKey<C>(key: string): Promise<C> {
    if (!(key in this.store)) {
      throw new Error(`Key (${key}) does not exist in store`);
    }

    // If key specified is a sub store then get the full set of values
    const configValue = this.store[key];
    if (configValue instanceof ConfigStore) {
      this.logger.debug('Requested key is store, retrieving all store values');
      return configValue.getValue();
    }

    if (configValue.hasBeenSet()) {
      this.logger.debug('Value for key already set, retrieving from cache');
      return configValue.getValue();
    }

    this.logger.debug(`No value loaded for ${key}, loading...`);

    const keySchema = this.schema[key] as IConfigSchemaObj<C>;
    const src = keySchema._source;
    const srcKey = keySchema._key ?? key;

    if (!src || !srcKey) {
      if (configValue.hasDefaultBeenSet()) {
        this.logger.debug('No source or key, loading default');
        return configValue.getValue();
      }

      throw new InvalidSchemaError(
        `No _source & _key specified for key: ${key}, either specify a default, use environment files or define the _source & _key.`
      );
    }

    let value: any;
    try {
      // Load, validate and set the value from the external source
      value = await this.loader.loadFromSource(src, srcKey);
      this.logger.debug(`Loaded key (${srcKey}) from source`);
      value = this.validator.cast(keySchema, value);
      await this.validator.validate(keySchema, value);
    } catch (e) {
      // If we couldn't load the key, fallback gracefully to the default
      if (!(e instanceof KeyLoadingError) || !configValue.hasDefaultBeenSet()) {
        throw e;
      }

      value = configValue.getValue();
    }

    configValue.setValue(value);
    return value;
  }

  /**
   * Run a callback on each entry in the store
   * @param callback 
   */
  public each(callback: (key: string, value: ConfigStore | ConfigValue) => void) {
    for (const key in this.store) {
      if (!this.store.hasOwnProperty(key)) {
        continue;
      }

      callback(key, this.store[key]);
    }
  }
}