// tslint:disable max-classes-per-file
import { Resolver } from '../../../src/utils/Resolver';
import { IObject, ILoader } from '../../../src/types';
import { InvalidResolvableError } from '../../../src/errors';

const mockLoaderConstructor = jest.fn();

class DefaultSetLoader implements ILoader<string> {
  constructor(...args: any[]) {
    mockLoaderConstructor(...args);
  }
  async load(key: string): Promise<string> {
    return 'Value';
  }
}

class NotRegisteredLoader implements ILoader<string> {
  async load(key: string): Promise<string> {
    return 'Value';
  }
}

let resolver: Resolver<ILoader>;
const configRetrieverMock = jest.fn();
const mockLogger = {
  spawn: jest.fn()
};

beforeEach(() => {
  resolver = new Resolver<ILoader>({
    registered: {
      defaultSetLoader: DefaultSetLoader
    },
    configRetriever: (loader: string): IObject => {
      return configRetrieverMock(loader);
    },
    logger: mockLogger as any,
  });
});

describe('Resolver.resolve', () => {
  describe('If not registered', () => {
    it('Will throw an error', async () => {
      await expect(resolver.resolve('notRegisteredLoader')).rejects.toThrow(InvalidResolvableError);
    });
  });

  describe('If registered', () => {
    const mockSpawnedLogger = jest.fn();
    beforeEach(() => {
      configRetrieverMock.mockResolvedValueOnce({
        hello: 'world',
        a: 'value'
      });
      mockLogger.spawn.mockReturnValueOnce(mockSpawnedLogger as any)
    });
    it('Will construct with the config passed from configRetriever', async () => {
      const resolved = await resolver.resolve('defaultSetLoader');
      expect(resolved).toBeInstanceOf(DefaultSetLoader);

      // Check logger spawned correctly
      expect(mockLogger.spawn).toHaveBeenCalledTimes(1);
      expect(mockLogger.spawn).toHaveBeenCalledWith('Resolved.defaultSetLoader');

      // Check constructor called with config from configRetriever
      expect(mockLoaderConstructor).toHaveBeenCalledTimes(1);
      expect(mockLoaderConstructor).toHaveBeenCalledWith({
        logger: mockSpawnedLogger,
        hello: 'world',
        a: 'value'
      });
    });
  });
});

describe('Resolver.register', () => {
  it('Will set into loaders and be resolvable', async () => {
    await expect(resolver.resolve('notRegisteredLoader')).rejects.toThrow(InvalidResolvableError);

    resolver.register('notRegisteredLoader', NotRegisteredLoader);
    await expect(resolver.resolve('notRegisteredLoader')).resolves.toBeInstanceOf(NotRegisteredLoader);
  });
});

describe('Resolver.add', () => {
  it('Will set into loaders and return directly when resolved', async () => {
    const notRegisteredLoader = new NotRegisteredLoader();
    await expect(resolver.resolve('notRegisteredLoader')).rejects.toThrow(InvalidResolvableError);

    resolver.add('notRegisteredLoader', notRegisteredLoader);
    await expect(resolver.resolve('notRegisteredLoader')).resolves.toBe(notRegisteredLoader);
  });
});