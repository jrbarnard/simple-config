import { ValueBase } from './ValueBase';
import { ConfigValue } from './ConfigValue';
import { isConfigSchemaObject } from './utils/guards';
import { ConfigSchema, ILogger, Options, IObject } from './types';

type InternalStoreItem<T> = ConfigStore<T> | ConfigValue<T>;
type InternalStore<T> = {
  [P in keyof T]: InternalStoreItem<T[P]>;
};

export class ConfigStore<T extends IObject> extends ValueBase<T> {
  private store: InternalStore<T>;
  private schema: ConfigSchema<T>;
  private logger: ILogger;

  constructor(options: Options.IConfigStoreOptions<T>) {
    super();
    this.logger = options.logger;
    this.schema = options.schema;
    this.store = this.generateFromSchema(this.schema);
  }

  /**
   * Generates the store tree from the passed schema
   * @param schema 
   */
  private generateFromSchema(schema: ConfigSchema<T>): InternalStore<T> {
    const store: InternalStore<T> = {} as InternalStore<T>;

    for (const key in schema) {
      let value: InternalStoreItem<T[Extract<keyof T, string>]>;
      const keySchema = schema[key];
      if (isConfigSchemaObject(keySchema)) {
        value = new ConfigValue(keySchema);
      } else {
        value = new ConfigStore({
          schema: keySchema as ConfigSchema<T[Extract<keyof T, string>]>,
          logger: this.logger.spawn(`ConfigStore[${key}]`)
        });
      }

      store[key] = value;
    }

    return store;
  }

  /**
   * Load from cache if can, otherwise recursively get
   */
  public getValue(): T {
    if (this.hasBeenSet()) {
      return this.value;
    }

    const mapped: T = {} as T;
    for (const key in this.store) {
      mapped[key] = this.store[key].getValue();
    }

    return mapped;
  }

  /**
   * Run a callback on each entry in the store
   * @param callback 
   */
  public each<R>(callback: (key: string, value: InternalStoreItem<T[keyof T]>) => Promise<R> | R): Promise<R[]> | R[] {
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