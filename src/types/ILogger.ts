export interface ILogger {
  error(...logs: any[]): void;
  info(...logs: any[]): void;
  debug(...logs: any[]): void;
  spawn(...logs: any[]): ILogger;
}