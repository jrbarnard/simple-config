type Type = StringConstructor | NumberConstructor | BooleanConstructor;

export interface IConfigSchemaObj {
  _type: Type;
  _default?: string | number | boolean;
  _source?: string;
  _key?: string;
}

export type ConfigSchema<T> = {
  [P in keyof T]: ConfigSchema<T[P]> | IConfigSchemaObj;
}