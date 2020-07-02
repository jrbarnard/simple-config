import { ILogger } from '../../../src/types';

export const createMockLogger = (): jest.Mocked<ILogger> => {
  return {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    spawn: jest.fn()
  };
};
