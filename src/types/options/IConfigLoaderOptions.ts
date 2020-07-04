import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';
import { IResolver } from '../IResolver';
import { ILoader } from '../ILoader';
import { IConfigValidator } from '../IConfigValidator';

export interface IConfigLoaderOptions extends IExpectsLoggerOptions {
  loaderResolver: IResolver<ILoader>;
  validator: IConfigValidator;
}