import { ILogger, LogLevel } from '../ILogger';

export interface ILoggerOptions {
  /**
   * Optional
   * The namespace of the logger (will be displayed when logging)
   * Defaults to ''
   */
  namespace?: string;
  /**
   * Optional
   * The log level to output
   * Defaults to LogLevel.Error
   */
  level?: LogLevel;
  /**
   * Optional
   * If this is a child logger, the parent logger it is the child of
   * It will output the parent namespace as part of the child logger
   */
  parent?: ILogger;
}