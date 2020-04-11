import * as fs from 'fs';
import { promisify } from 'util';
import { Options, ILogger, IConfigLoader, IResolver, ILoader } from '../types';
import { SchemaNotFoundError, InvalidSchemaError } from '../errors';

export class ConfigLoader implements IConfigLoader {
  private logger: ILogger;
  private directory: string = 'config';
  private loaderResolver: IResolver<ILoader>;

  constructor(options: Options.IConfigLoaderOptions) {
    this.logger = options.logger;
    this.directory = options.directory ?? 'config';
    this.loaderResolver = options.loaderResolver;
  }

  private getCwd() {
    return process.cwd();
  }

  private getDirectoryPath() {
    return [this.getCwd(), this.directory].join('/');
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
  public async load<T>(file: string): Promise<T> {
    const path = `${this.getDirectoryPath()}/${file}`;
    this.logger.debug(`Loading config file: ${path}`);

    const exists = await promisify(fs.exists)(path);

    if (!exists) {
      throw new SchemaNotFoundError('Config file not found');
    }

    let config: T;
    try {
      this.logger.debug(`Decoding config file`);
      config = JSON.parse(fs.readFileSync(path).toString());
    } catch (e) {
      this.logger.error(`Failed to load and parse config file: ${path}: ${e.message}`);
      throw new InvalidSchemaError('The config file is invalid');
    }

    return config;
  }
}