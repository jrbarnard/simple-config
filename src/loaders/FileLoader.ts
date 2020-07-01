import * as fs from 'fs';
import * as path from 'path';
import { ILoader, ILogger, IObject, Loaders, Options } from '../types';
import { KeyLoadingError, FileNotFoundError, InvalidSchemaError } from '../errors';

interface IFileLoaderOptions extends Loaders.IFileLoaderConfigurableOptions, Options.IExpectsLoggerOptions {
  //
}

/**
 * Load values from an environment file
 */
export class FileLoader implements ILoader<any | IObject> {
  private path: string;
  private logger: ILogger;
  private loaded?: IObject | undefined;

  constructor(options: IFileLoaderOptions) {
    this.path = options.path;
    this.logger = options.logger;
  }

  /**
   * Load the config file
   */
  private loadFile(): IObject {
    const filePath = path.resolve(this.path);
    this.logger.debug(`Loading file: ${filePath}`);

    const exists = fs.existsSync(filePath);

    if (!exists) {
      throw new FileNotFoundError(filePath);
    }

    let config: IObject;
    try {
      this.logger.debug(`Decoding config file`);
      config = JSON.parse(fs.readFileSync(filePath).toString());

      if (typeof config !== 'object' || config === null || Array.isArray(config)) {
        throw new Error();
      }
    } catch (e) {
      this.logger.error(`Failed to load and parse config file: ${filePath}: ${e.message}`);
      throw new InvalidSchemaError('The config file is invalid');
    }

    this.logger.debug(`Loaded file contents: ${JSON.stringify(config)}`);
    
    return config;
  }

  /**
   * Load the whole file
   * @param key 
   */
  async load(key: '*'): Promise<IObject>;

  /**
   * Load a specific key of the file
   * @param key 
   */
  async load(key: string): Promise<any>;

  /**
   * Load the key from the config file
   * @param key 
   */
  async load(key: string): Promise<any | IObject> {
    if (this.loaded === undefined) {
      this.loaded = this.loadFile();
    }

    if (key === '*') {
      return this.loaded;
    }

    if (!(key in this.loaded)) {
      throw new KeyLoadingError(key, this, `No key in config file: ${this.path}`);
    }

    return this.loaded[key];
  }
}