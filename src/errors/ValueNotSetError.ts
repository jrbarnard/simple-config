import { ILoader } from '../types';

export class ValueNotSetError extends Error {
  name = 'ValueNotSetError';
  private loader: ILoader;
  constructor(key: string, loader?: ILoader, hint = '') {
    super([
      `No value set for key: ${key}`,
      loader ? `from loader: ${loader.constructor.name}` : '',
      hint ? `- Hint: ${hint}` : ''
    ].join(' '));
    this.loader = loader;
  }
}