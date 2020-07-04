import { ILoader } from '../types';

export class KeyLoadingError extends Error {
  name = 'KeyLoadingError';
  private loader: ILoader;
  constructor(key: string, loader: ILoader) {
    super(
      `Failed to load key: ${key} from loader: ${loader.constructor.name}`
    );
    this.loader = loader;
  }
}