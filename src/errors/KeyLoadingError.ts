import { ILoader } from '../types';

export class KeyLoadingError extends Error {
  private loader: ILoader;
  constructor(key: string, loader: ILoader, hint: string = '') {
    super(
      `Failed to load key: ${key} from loader: ${loader.constructor.name}${hint ? ` - Hint: ${hint}` : ''}`
    );
    this.loader = loader;
  }
}