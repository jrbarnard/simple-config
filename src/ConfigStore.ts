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
  // private value: IMappedStore | undefined = undefined;
  private isSet = false;

  constructor(options: Options.IConfigStoreOptions) {
    this.logger = options.logger;
    this.schema = options.schema;
    this.generateFromSchema(this.schema);
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

  public hasBeenSet(): boolean {
    return this.isSet;
  }

  public getValue<C>(): C | undefined {
    // TODO: HANDLE CACHED
    const mapped: IMappedStore = {};
    for (const key in this.store) {
      mapped[key] = this.store[key].getValue();
    }

    return mapped as C;
  }

  public setValue(_value: any): this {
    this.isSet = true;
    return this;
  }

  // TODO: JOIN TOGETHER
  /**
   * Run a callback on each entry in the store
   * @param callback 
   */
  public each(callback: (key: string, value: ConfigStore | ConfigValue) => void): void {
    for (const key in this.store) {
      callback(key, this.store[key]);
    }
  }

  /**
   * Run an async callback on each entry in the store
   * @param callback 
   */
  public eachAsync<R>(callback: (key: string, value: ConfigStore | ConfigValue) => Promise<R>): Promise<R[]> {
    const promises: Promise<R>[] = [];
    for (const key in this.store) {
      promises.push(callback(key, this.store[key]));
    }

    return Promise.all(promises);
  }
}