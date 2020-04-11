import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';
import { ILoaderConstructors } from '../ILoader';
import { IConfigRetriever } from '../loaders';

export interface ILoaderResolverOptions extends IExpectsLoggerOptions {
  loaders: ILoaderConstructors;
  configRetriever: IConfigRetriever;
}