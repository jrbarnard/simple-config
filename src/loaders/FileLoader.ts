import * as fs from 'fs';
import { ILoader, ILogger, IObject } from '../types';
import { KeyLoadingError, FileNotFoundError, InvalidSchemaError } from '../errors';
import { IExpectsLoggerOptions } from '../types/options';

interface IFileLoaderOptions extends IExpectsLoggerOptions {
  path: string;
}

/**
 * Load values from an environment file
 */
export class FileLoader implements ILoader<string  | IObject> {
  private path: string;
  private logger: ILogger;
  private loaded?: IObject | undefined;

  constructor(options: IFileLoaderOptions) {
    this.path = options.path;
    this.logger = options.logger;
  }

  /**
   * Get the current working directory
   */
  private getCwd() {
    return process.cwd();
  }

  /**
   * Get the full file path
   */
  private getFullFilePath() {
    return [this.getCwd(), this.path].join('/');
  }

  /**
   * Load the config file
   */
  private loadFile(): IObject {
    const path = this.getFullFilePath();
    this.logger.debug(`Loading file: ${path}`);

    const exists = fs.existsSync(path);

    if (!exists) {
      throw new FileNotFoundError(path);
    }

    let config: IObject;
    try {
      this.logger.debug(`Decoding config file`);
      config = JSON.parse(fs.readFileSync(path).toString());
    } catch (e) {
      this.logger.error(`Failed to load and parse config file: ${path}: ${e.message}`);
      throw new InvalidSchemaError('The config file is invalid');
    }
    
    return config;
  }

  async load(key: '*'): Promise<IObject>;
  async load(key: string): Promise<string>;

  /**
   * Load the key from the config file
   * @param key 
   */
  async load(key: string): Promise<string | IObject> {
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