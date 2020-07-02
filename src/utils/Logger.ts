import { ILogger, Options, LogLevel } from '../types';

export class Logger implements ILogger {
  private namespace: string;
  private logLevel: LogLevel;
  private parent: ILogger;

  constructor(options: Options.ILoggerOptions = {}) {
    this.namespace = options.namespace ?? '';
    this.logLevel = options.level ?? LogLevel.Error;
    this.parent = options.parent;
  }

  /**
   * Set the log level
   * @param level 
   */
  public setLevel(level: LogLevel): this {
    this.logLevel = level;
    return this;
  }

  /**
   * Is the log level set so that we should log the passed level?
   * @param level 
   */
  public shouldLog(level: LogLevel): boolean {
    return this.logLevel <= level;
  }

  /**
   * 
   * @param prefix
   */
  public getLogPrefix(prefix: string): string {
    prefix += ': ';

    if (this.namespace) {
      prefix += `${this.namespace} - `;
    }

    return prefix;
  }

  /**
   * Optionally prefix string logs
   * @param log 
   * @param prefix 
   */
  public maybePrefix(log: any, prefix: string): any {
    if (typeof log === 'string') {
      log = `${this.getLogPrefix(prefix)}${log}`;
    }

    return log;
  }

  /**
   * Prep an array of logs for output
   * @param logs 
   * @param prefix 
   */
  public prepareLogs(logs: any[], prefix: string): any {
    logs = logs.map((log: any) => this.maybePrefix(log, prefix));

    // Ensure we always have a prefix to log
    if (typeof logs[0] !== 'string') {
      logs.unshift(this.getLogPrefix(prefix));
    }
    
    return logs;
  }

  /**
   * General log
   * @param logs 
   */
  public log(...logs: any[]): this {
    console.log(...logs);
    return this;
  }

  /**
   * Error level logging
   * @param logs 
   */
  public error(...logs: any[]): this {
    if (this.shouldLog(LogLevel.Error)) {
      console.error(...this.prepareLogs(logs, 'ERROR'));
    }
    
    return this;
  }

  /**
   * Info level logging
   * @param logs 
   */
  public info(...logs: any[]): this {
    if (this.shouldLog(LogLevel.Info)) {
      console.info(...this.prepareLogs(logs, 'INFO'));
    }

    return this;
  }

  /**
   * Debug level logging
   * @param logs 
   */
  public debug(...logs: any[]): this {
    if (this.shouldLog(LogLevel.Debug)) {
      console.debug(...this.prepareLogs(logs, 'DEBUG'));
    }

    return this;
  }

  public spawn(namespace: string): ILogger {
    return new Logger({
      level: this.logLevel,
      parent: this,
      namespace: (this.namespace ? `${this.namespace}.` : '') + namespace
    });
  }
}