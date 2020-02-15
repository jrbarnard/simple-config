import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';
import { ILoaderConstructors } from '../ILoader';
import { Config } from '../../Config';

export interface ILoaderResolverOptions<T> extends IExpectsLoggerOptions {
  loaders: ILoaderConstructors;
  config: Config<T>;
}