import { Source } from './Source';

type Type = StringConstructor | NumberConstructor | BooleanConstructor;
// type ConfigValue = string | number | boolean;

export interface IConfigSchemaObj {
  _type: Type;
  _default?: string | number | boolean;
  _source?: Source;
  _key?: string;
}

export type ConfigSchema<T> = {
  [P in keyof T]: ConfigSchema<T[P]> | IConfigSchemaObj;
}