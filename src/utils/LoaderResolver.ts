import { ILoaderResolver, ILoader } from '../types';
import { InvalidLoaderError } from '../errors';

interface ILoaders {
  [k: string]: ILoader;
};

// TODO: Add ability to define loaders as config and them build also
// Potentially with access to config.
export class LoaderResolver implements ILoaderResolver {
  private loaders: ILoaders;
  constructor(loaders: ILoaders) {
    this.loaders = loaders;
  }

  resolve(loader: string): ILoader {
    if (!(loader in this.loaders)) {
      throw new InvalidLoaderError(loader);
    }

    return this.loaders[loader];
  }
}