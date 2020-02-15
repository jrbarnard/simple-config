import { ConfigSchema, ILogger, IConfigStoreOptions, IConfigLoader, IConfigSchemaObj, IConfigValidator } from './types';
import { ConfigValue } from './ConfigValue';
import { InvalidSchemaError } from './errors';

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

  constructor(options: IConfigStoreOptions) {
    this.logger = options.logger;
    this.schema = options.schema;
    this.loader = options.loader;
    this.validator = options.validator;
    this.generateFromSchema(this.schema);
  }

  private generateFromSchema(schema: ConfigSchema<any>) {
    const store: any = {};

    for (const key in schema) {
      if (!schema.hasOwnProperty(key)) {
        continue;
      }

      let value: ConfigValue | ConfigStore;
      if ('_type' in schema[key]) {
        value = new ConfigValue();
        value.setDefault(schema[key]._default);
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
  public async getValueForKey(key: string): Promise<any> {
    if (!(key in this.store)) {
      throw new Error(`Key (${key}) does not exist in store`);
    }

    const storeKeyValue = this.store[key];
    if (storeKeyValue instanceof ConfigStore) {
      return storeKeyValue.getValue();
    }

    if (storeKeyValue.hasBeenSet()) {
      return storeKeyValue.getValue();
    }

    this.logger.debug(`No value loaded for ${key}, loading...`);

    const keySchema = this.schema[key] as IConfigSchemaObj;
    const src = keySchema._source;
    const srcKey = keySchema._key ?? key;
    const hasDefault = storeKeyValue.hasBeenDefaultSet();

    try {
      if (!src || !srcKey) {
        throw new InvalidSchemaError(
          `No _src & _key specified for key: ${key}, either specify a default, use environment files or define the _src & _key.`
        );
      }

      // Load, validate and set the value from the external source
      const value = await this.loader.loadFromSource(src, srcKey);
      this.logger.debug(`Loaded key (${srcKey}) from source`);
      await this.validator.validate(keySchema, value);
      storeKeyValue.setValue(value);
    } catch (e) {
      // If no external source / failed to get from external source but has a default value then resolve that
      if (!hasDefault) {
        throw e;
      }
      
      storeKeyValue.setValue(storeKeyValue.getValue());
    }

    return storeKeyValue.getValue();
  }

  public each(callback: (key: string, value: ConfigStore | ConfigValue) => void) {
    for (const key in this.store) {
      if (!this.store.hasOwnProperty(key)) {
        continue;
      }

      callback(key, this.store[key]);
    }
  }
}