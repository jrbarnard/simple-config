type Type = StringConstructor | NumberConstructor | BooleanConstructor;

export interface IConfigSchemaObj<T> {
  _type: Type;
  _default?: T;
  _source?: string;
  _key?: string;
}

export type ConfigSchema<T> = {
  [P in keyof T]: ConfigSchema<T[P]> | IConfigSchemaObj<T[P]>;
}