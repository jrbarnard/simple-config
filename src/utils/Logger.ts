import { ILogger } from '../types';

/**
 * TODO: Improve to handle logging a full error if we can
 */
export class Logger implements ILogger {
  private namespace: string;
  private parent: ILogger;

  constructor(namespace?: string, parent?: ILogger) {
    this.namespace = namespace ?? '';
    this.parent = parent;
  }

  scopeMessage(message: string) {
    return !this.namespace ? message : `${this.namespace} - ${message}`;
  }

  error(message: string): void {
    console.error(`ERROR: ${this.scopeMessage(message)}`);
  }

  info(message: string): void {
    // tslint:disable-next-line: no-console
    console.info(`INFO: ${this.scopeMessage(message)}`);
  }

  debug(message: string): void {
    // tslint:disable-next-line: no-console
    console.debug(`DEBUG: ${this.scopeMessage(message)}`);
  }

  spawn(namespace: string): ILogger {
    return new Logger(namespace, this);
  }
}