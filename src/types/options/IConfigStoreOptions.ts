import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';
import { ConfigSchema } from '../ConfigSchema';
import { IConfigLoader } from '../IConfigLoader';
import { IConfigValidator } from '../IConfigValidator';

export interface IConfigStoreOptions extends IExpectsLoggerOptions {
  schema: ConfigSchema<any>;
  loader: IConfigLoader;
  validator: IConfigValidator;
};