import { IResolver, Options, ILogger, IConfigRetriever } from '../types';
import { InvalidResolvableError } from '../errors';
import { IResolvableConstructors, ResolvableConstructor } from '../types/IResolver';

/**
 * Class to resolve classes, either from constructors (and inject config)
 * Or from class instances added through add()
 * Can add more resolvable classes by key using register()
 */
export class Resolver<T> implements IResolver<T> {
  private instantiated: {
    [k: string]: T
  } = {};
  private registered: IResolvableConstructors<T> = {};
  private logger: ILogger;
  private configRetriever: IConfigRetriever;

  constructor(options: Options.IResolverOptions<T>) {
    this.registered = options.registered;
    this.logger = options.logger;
    this.configRetriever = options.configRetriever;
  }

  /**
   * Resolve a specific class by key
   * @param loader 
   */
  public async resolve(key: string): Promise<T> {
    if (!this.instantiated[key]) {
      // If not yet loaded but we don't have the config to configure it then it's invalid
      if (!(key in this.registered)) {
        throw new InvalidResolvableError(key);
      }

      // First time set up, merge on config from the retriever, always pass through a logger
      this.instantiated[key] = new this.registered[key]({
        ...await this.configRetriever(key),
        logger: this.logger.spawn(`Resolved.${key}`),
      });
    }

    return this.instantiated[key];
  }

  /**
   * Add an instantiated class to the resolver
   * Allows for customisation of the data sources for our config
   *
   * @param key 
   * @param instance
   */
  public add(key: string, instance: T): void {
    this.instantiated[key] = instance;
  }

  /**
   * Register a non instantiated class
   * @param key 
   * @param resolvableConstructor 
   */
  public register(key: string, resolvableConstructor: ResolvableConstructor<T>): void {
    this.registered[key] = resolvableConstructor;
  }
}