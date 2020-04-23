import { Logger, LogLevel } from '../../../src/utils/Logger';
import { ILogger } from '../../../src/types';

// tslint:disable: no-console
console.error = jest.fn();
console.info = jest.fn();
console.debug = jest.fn();

type LogMethods = Omit<ILogger, 'spawn'>;

type LogMapping = {
  [P in keyof LogMethods]: string;
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('Logger.constructor', () => {
  const logMapping: LogMapping = {
    info: 'INFO',
    error: 'ERROR',
    debug: 'DEBUG',
  };

  describe('When namespace passed', () => {
    it.each(Object.keys(logMapping))('It will output the namespace in the %s log', (logType) => {
      const logger = new Logger({
        namespace: 'anamespace',
        level: LogLevel.System
      });
      logger[logType as keyof ILogger]('Hello world');
      expect(console[logType as keyof Console]).toHaveBeenCalledTimes(1);
      expect(console[logType as keyof Console]).toHaveBeenCalledWith(`${logMapping[logType as keyof LogMapping]}: anamespace - Hello world`);
    });
  });
  describe('When namespace not passed', () => {
    it.each(Object.keys(logMapping))('It will not output the namespace in the %s log', (logType) => {
      const logger = new Logger({
        // namespace: ''
        level: LogLevel.System
      });
      logger[logType as keyof ILogger]('Hello world');
      expect(console[logType as keyof Console]).toHaveBeenCalledTimes(1);
      expect(console[logType as keyof Console]).toHaveBeenCalledWith(`${logMapping[logType as keyof LogMapping]}: Hello world`);
    });
  });
});

describe('When log level is error', () => {
  it('Will not log error types below that level', () => {
    const logger = new Logger({
      level: LogLevel.Error
    });

    logger.error('Does log');
    logger.debug('Does not log');
    logger.info('Does not log');

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('ERROR: Does log');
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });
});


describe('When log level is info', () => {
  it('Will not log error types below that level', () => {
    const logger = new Logger({
      level: LogLevel.Info
    });

    logger.error('Does log');
    logger.debug('Does not log');
    logger.info('Does log');

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('ERROR: Does log');
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith('INFO: Does log');
  });
});

describe('When log level is debug', () => {
  it('Will not log error types below that level', () => {
    const logger = new Logger({
      level: LogLevel.Debug
    });

    logger.error('Does log');
    logger.debug('Does log');
    logger.info('Does log');

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('ERROR: Does log');
    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenCalledWith('DEBUG: Does log');
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith('INFO: Does log');
  });
});