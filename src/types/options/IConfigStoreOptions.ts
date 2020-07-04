import { ConfigSchema } from '../ConfigSchema';
import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';

export interface IConfigStoreOptions extends IExpectsLoggerOptions {
  schema: ConfigSchema<any>;
};