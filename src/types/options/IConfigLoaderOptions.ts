import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';
import { IResolver } from '../IResolver';
import { ILoader } from '../ILoader';
import { IConfigValidator } from '../IConfigValidator';

export interface IConfigLoaderOptions extends IExpectsLoggerOptions {
  /**
   * The resolver to use to resolve config loaders
   */
  loaderResolver: IResolver<ILoader>;
  /**
   * The validator that will be used to check config matches it's defined schema
   */
  validator: IConfigValidator;
}