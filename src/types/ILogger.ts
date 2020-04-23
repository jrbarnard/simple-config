export interface ILogger {
  error(...logs: any[]): void;
  info(...logs: any[]): void;
  debug(...logs: any[]): void;
  spawn(...logs: any[]): ILogger;
}

export enum LogLevel {
  System = 0,
  Debug = 10,
  Info = 20,
  Error = 30
}