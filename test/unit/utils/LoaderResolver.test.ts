import { LoaderResolver } from '../../../src/utils/LoaderResolver';
import { IObject } from '../../../src/types';
import { Logger } from '../../../src/utils/Logger';

describe('LoaderResolver.resolve', () => {
  let resolver: LoaderResolver;
  const configRetrieverMock = jest.fn();

  beforeEach(() => {
    resolver = new LoaderResolver({
      loaders: {},
      configRetriever: (loader: string): IObject => {
        return configRetrieverMock(loader);
      },
      logger: jest.fn() as unknown as jest.Mocked<Logger>,
    });
  });

  describe('If loader not registered', () => {
    it('Will throw an error', () => {
      // TODO:
    });
  });
});