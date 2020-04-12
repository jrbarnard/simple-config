type Type = StringConstructor | NumberConstructor | BooleanConstructor;

export interface IConfigSchemaObj<T> {
  _type: Type;
  _default?: T;
  _source?: string;
  _key?: string;
}

export type ConfigSchemaValue<T> = ConfigSchema<T> | IConfigSchemaObj<T>;

export type ConfigSchema<T> = {
  [P in keyof T]: ConfigSchemaValue<T[P]>;
}