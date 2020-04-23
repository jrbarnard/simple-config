import { ILogger, LogLevel } from '../ILogger';

export interface ILoggerOptions {
  namespace?: string;
  level?: LogLevel;
  parent?: ILogger;
}