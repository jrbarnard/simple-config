export interface ILogger {
  /**
   * Log one or more error messages
   * @param logs 
   */
  error(...logs: any[]): void;
  /**
   * Log one or more info messages
   * @param logs 
   */
  info(...logs: any[]): void;
  /**
   * Log one or more debug messages
   * @param logs 
   */
  debug(...logs: any[]): void;
  /**
   * Spawn a new child logger instance under the specified namespace
   * @param namespace 
   */
  spawn(namespace: string): ILogger;
}

export enum LogLevel {
  System = 0,
  Debug = 10,
  Info = 20,
  Error = 30,
  Silent = 100
}