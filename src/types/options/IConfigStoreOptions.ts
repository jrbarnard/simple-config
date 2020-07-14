import { ConfigSchema } from '../ConfigSchema';
import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';

export interface IConfigStoreOptions extends IExpectsLoggerOptions {
  /**
   * The schema to use that defines the config store
   */
  schema: ConfigSchema<any>;
};