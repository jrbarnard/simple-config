import { ILogger } from '../ILogger';

export interface IConfigOptions {
  configDirectory?: string;
  logger?: ILogger;
  environment?: string;
};