import { ILogger } from '../ILogger';
import { IResolver } from '../IResolver';
import { ILoader } from '../ILoader';

export interface IConfigOptions {
  configDirectory?: string;
  logger?: ILogger;
  loaderResolver?: IResolver<ILoader>;
  environment?: string;
};