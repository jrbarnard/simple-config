import { SSMLoader } from '../../../src/loaders/SSMLoader';
import { createMockLogger } from '../testHelpers/mockLogger';

describe('SSMLoader.load', () => {
  beforeEach(() => {
    jest.resetModules()
  });

  describe('If SSM library cannot be located', () => {
    it('Will throw', async () => {
      const loader = new SSMLoader({
        logger: createMockLogger()
      });
      await expect(loader.load('some-key')).rejects.toThrow('You must install the aws-sdk in order to use the SSMLoader: npm i aws-sdk');
    });
  });

  describe('If getParameter throws', () => {
    const mockGetParameter = jest.fn(() => ({
      promise: jest.fn().mockRejectedValueOnce(error)
    }));
    const error = new Error('Some error');
    beforeEach(() => {
      jest.mock('aws-sdk/clients/ssm', () => {
        return class {
          getParameter = mockGetParameter;
        };
      }, {
        virtual: true
      });
    });
    it('Will throw a KeyLoadingError', async () => {
      const logger = createMockLogger();
      const loader = new SSMLoader({
        logger
      });
      await expect(loader.load('some-key')).rejects.toThrow('Failed to load key: some-key from loader: SSMLoader');
      expect(mockGetParameter).toHaveBeenCalledWith({
        Name: 'some-key',
      });
      expect(logger.error).toHaveBeenCalledWith('Failed to load key (some-key) from SSM: Some error');
    });
  })
});