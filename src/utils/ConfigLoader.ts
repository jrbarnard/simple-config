import { Options, ILogger, IConfigLoader, IResolver, ILoader } from '../types';

export class ConfigLoader implements IConfigLoader {
  private logger: ILogger;
  private loaderResolver: IResolver<ILoader>;

  constructor(options: Options.IConfigLoaderOptions) {
    this.logger = options.logger;
    this.loaderResolver = options.loaderResolver;
  }

  /**
   * Load a key from a specific source
   * @param source 
   * @param key 
   */
  public async loadFromSource(source: string, key: string): Promise<any> {
    const loader = await this.loaderResolver.resolve(source);
    return loader.load(key);
  }
}