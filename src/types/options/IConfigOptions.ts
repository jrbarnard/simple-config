import { ILogger } from '../ILogger';
import { IResolver } from '../IResolver';
import { ILoader } from '../ILoader';

export interface IConfigOptions {
  configDirectory?: string;
  logger?: ILogger;
  environment?: string;
};