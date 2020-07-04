import { ConfigValue } from './ConfigValue';
import { isConfigSchemaObject } from './utils/guards';
import { ConfigSchema, ILogger, Options, IHasValue } from './types';

interface IInternalStore {
  [k: string]: ConfigStore | ConfigValue;
};

interface IMappedStore {
  [k: string]: any;
};

export class ConfigStore implements IHasValue {
  private store: IInternalStore = {};
  private schema: ConfigSchema<any>;
  private logger: ILogger;
  private value: IMappedStore | undefined = undefined;

  constructor(options: Options.IConfigStoreOptions) {
    this.logger = options.logger;
    this.schema = options.schema;
    this.generateFromSchema(this.schema);
  }
  
  public hasBeenSet(): boolean {
    return false; // TODO: IMPLEMENT CACHING
  }

  /**
   * Generates the store tree from the passed schema
   * @param schema 
   */
  private generateFromSchema(schema: ConfigSchema<any>) {
    const store: IInternalStore = {};

    for (const key in schema) {
      let value: ConfigValue | ConfigStore;
      const keySchema = schema[key];
      if (isConfigSchemaObject(keySchema)) {
        value = new ConfigValue(keySchema);
      } else {
        value = new ConfigStore({
          schema: keySchema,
          logger: this.logger.spawn(`ConfigStore[${key}]`)
        });
      }

      store[key] = value;
    }

    this.store = store;
  }

  /**
   * Gets all the store values into an object literal
   * If some of the values haven't yet been retrieved it will retrieve them
   * Will get recursively
   */
  public getValue(defaultValue: IMappedStore = {}): IMappedStore {
    const mapped: IMappedStore = {};
    for (const key in this.store) {
      mapped[key] = this.store[key].getValue(key in defaultValue ? defaultValue[key] : undefined);
    }

    return mapped;
  }

  public setValue(value: IMappedStore): this {
    this.value = value;
    return this;
  }

  /**
   * Run a callback on each entry in the store
   * @param callback 
   */
  public each(callback: (key: string, value: ConfigStore | ConfigValue) => void): void {
    for (const key in this.store) {
      callback(key, this.store[key]);
    }
  }

  public eachAsync<R>(callback: (key: string, value: ConfigStore | ConfigValue) => Promise<R>): Promise<R[]> {
    const promises: Promise<R>[] = [];
    for (const key in this.store) {
      promises.push(callback(key, this.store[key]));
    }

    return Promise.all(promises);
  }
}