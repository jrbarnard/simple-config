import { ILogger } from '../ILogger';
import { ILoaderResolver } from '../ILoaderResolver';

export interface IConfigOptions {
  configDirectory?: string;
  logger?: ILogger;
  loaderResolver?: ILoaderResolver;
};