import { Options, ILogger, IConfigLoader, IResolver, ILoader, IObject } from '../types';
import { FileLoader } from '../loaders/FileLoader';
import { FileNotFoundError } from '../errors';

export class ConfigLoader implements IConfigLoader {
  private logger: ILogger;
  private directory: string = 'config';
  private loaderResolver: IResolver<ILoader>;

  constructor(options: Options.IConfigLoaderOptions) {
    this.logger = options.logger;
    this.directory = options.directory ?? 'config';
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

  // TODO: Extract this to a source
  public async load(file: string): Promise<IObject> {
    const loader = new FileLoader({
      path: `${this.directory}/${file}.json`,
      logger: this.logger
    });

    let loaded: IObject = {};
    try {
      loaded = await loader.load('*');
    } catch (e) {
      if (!(e instanceof FileNotFoundError)) {
        throw e;
      }
    }

    return loaded;
  }
}