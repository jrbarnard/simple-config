import { IExpectsLoggerOptions } from './IExpectsLoggerOptions';
import { IResolvableConstructors } from '../IResolver';
import { IConfigRetriever } from '../IConfigRetriever';

export interface IResolverOptions<T> extends IExpectsLoggerOptions {
  /**
   * A map of registered class constructors
   * 'key': MyClass
   */
  registered: IResolvableConstructors<T>;
  /**
   * The function to be used to retrieve the resolvables config from.
   * Will accept a resolvable key and must return a config object.
   * The returned config will be passed into the resolvable constructor.
   */
  configRetriever: IConfigRetriever;
}