import { ILogger } from '../ILogger';

export interface IConfigOptions {
  /**
   * Optional
   * The logger to use, if not set will instantiate it's own
   */
  logger?: ILogger;
};