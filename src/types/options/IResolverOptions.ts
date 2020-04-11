import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';
import { IResolvableConstructors } from '../IResolver';
import { IConfigRetriever } from '../IConfigRetriever';

export interface IResolverOptions<T> extends IExpectsLoggerOptions {
  registered: IResolvableConstructors<T>;
  configRetriever: IConfigRetriever;
}