import { EnvironmentLoader } from '../../../src/loaders/EnvironmentLoader';
import { ValueNotSetError } from '../../../src/errors';

describe('EnvironmentLoader.load', () => {
  let loader: EnvironmentLoader;
  beforeEach(() => {
    loader = new EnvironmentLoader();
  });
  describe('When no key present in environment', () => {
    beforeEach(() => {
      delete process.env.TEST_NO_VALUE;
    });
    it('Will throw the error', async () => {
      await expect(loader.load('TEST_NO_VALUE')).rejects.toThrow(ValueNotSetError);
    });
  });
  describe('When a key is present in environment', () => {
    beforeEach(() => {
      process.env.TEST_A_VALUE = 'Hello World';
    });
    afterEach(() => {
      delete process.env.TEST_A_VALUE;
    });
    it('Will pass back value', async () => {
      await expect(loader.load('TEST_A_VALUE')).resolves.toBe('Hello World');
    });
  });
});