import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';
import { IResolver } from '../IResolver';
import { ILoader } from '../ILoader';

export interface IConfigLoaderOptions extends IExpectsLoggerOptions {
  loaderResolver: IResolver<ILoader>;
}