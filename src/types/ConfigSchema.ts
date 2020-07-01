type Type = StringConstructor | NumberConstructor | BooleanConstructor;

export interface IConfigSchemaObj<T> {
  /**
   * The type of the value, will be used to validate and cast
   * the value on the way out
   */
  _type: Type;
  /**
   * Optional
   * Default value to use if not set in the specified source
   */
  _default?: T;
  /**
   * Optional
   * The loader source of the config item
   * If left empty will attempt to load from environment files
   */
  _source?: string;
  /**
   * Optional
   * The key to use to extract from the config source
   * If not set, will use the key in the config schema
   */
  _key?: string;
}

export type ConfigSchemaValue<T> = ConfigSchema<T> | IConfigSchemaObj<T>;

export type ConfigSchema<T> = {
  [P in keyof T]: ConfigSchemaValue<T[P]>;
}