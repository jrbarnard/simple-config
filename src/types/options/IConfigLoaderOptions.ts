import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';
import { ILoaderResolver } from '../ILoaderResolver';

export interface IConfigLoaderOptions extends IExpectsLoggerOptions {
  directory?: string;
  loaderResolver: ILoaderResolver;
}