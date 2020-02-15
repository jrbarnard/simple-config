import { ILoaderResolver, ILoader, ILoaderResolverOptions, ILoaders, ILogger, ILoaderConstructors } from '../types';
import { InvalidLoaderError } from '../errors';
import { Config } from '../Config';

/**
 * Class to resolve loader classes, either from constructors (and inject config)
 * Or from class instances added through addLoader()
 */
export class LoaderResolver<T> implements ILoaderResolver {
  private loaders: ILoaders = {};
  private loaderConfig: ILoaderConstructors = {};
  private logger: ILogger;
  private config: Config<T>;

  constructor(options: ILoaderResolverOptions<T>) {
    this.loaderConfig = options.loaders;
    this.logger = options.logger;
    this.config = options.config;
  }

  /**
   * Resolve a specific loader by key
   * @param loader 
   */
  public async resolve(loader: string): Promise<ILoader> {
    if (!this.loaders[loader]) {
      // If not yet loaded but we don't have the config to cofigure it then it's invalid
      if (!(loader in this.loaderConfig)) {
        throw new InvalidLoaderError(loader);
      }

      // First time set up
      // Pass through the matching config under loaders.{loader}, e.g loaders.ssm
      // Always pass through a logger
      this.loaders[loader] = new this.loaderConfig[loader]({
        logger: this.logger.spawn(`Loader.${loader}`),
        ...await this.config.get<any>(`loaders.${loader}`, {})
      });
    }

    return this.loaders[loader];
  }

  /**
   * Add a loader to the resolver
   * Allows for customisation of the data sources for our config
   *
   * @param loaderKey 
   * @param loader
   */
  public addLoader(loaderKey: string, loader: ILoader): void {
    this.loaders[loaderKey] = loader;
  }
}