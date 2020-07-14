import { ValueBase } from './ValueBase';
import { ConfigValue } from './ConfigValue';
import { isConfigSchemaObject } from './utils/guards';
import { ConfigSchema, ILogger, Options, IObject, IInternalStore } from './types';

export class ConfigStore extends ValueBase {
  private store: IInternalStore = {};
  private schema: ConfigSchema<any>;
  private logger: ILogger;

  constructor(options: Options.IConfigStoreOptions) {
    super();
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

  /**
   * Load from cache if can, otherwise recursively get
   */
  public getValue<C>(): C | undefined {
    if (this.hasBeenSet()) {
      return this.value;
    }

    const mapped: IObject = {};
    for (const key in this.store) {
      mapped[key] = this.store[key].getValue();
    }

    return mapped as C;
  }

  /**
   * Run a callback on each entry in the store
   * @param callback 
   */
  public each<R>(callback: (key: string, value: ConfigStore | ConfigValue) => Promise<R> | R): Promise<R[]> | R[] {
    const promises: Promise<R>[] = [];
    const results: R[] = [];
    for (const key in this.store) {
      const result = callback(key, this.store[key]);
      if (result instanceof Promise) {
        promises.push(result);
      } else {
        results.push(result);
      }
    }

    if (promises.length) {
      return Promise.all(promises);
    }

    return results;
  }
}