import { ILogger, LogLevel } from '../ILogger';

export interface IConfigOptions {
  /**
   * Optional
   * The directory path to look for config files in
   * Defaults to ./config from the current working directory
   */
  configDirectory?: string;
  /**
   * Optional
   * The logger to use, if not set will instantiate it's own
   */
  logger?: ILogger;
  /**
   * Optional
   * The environment we are using config for.
   * This will be used to retrieve the environment config file, e.g ./config/{environment}.json
   */
  environment?: string;
};