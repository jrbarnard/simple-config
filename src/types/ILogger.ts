export interface ILogger {
  error(message: string): void;
  info(message: string): void;
  debug(message: string): void;
  spawn(namespace: string): ILogger;
}