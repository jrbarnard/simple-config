import { ILoader } from '../types';
import { KeyLoadingError } from '../errors';

/**
 * Load environment variables
 */
export class EnvironmentLoader implements ILoader {

  async load(key: string): Promise<any> {
    if (!(key in process.env)) {
      throw new KeyLoadingError(key, this, 'No key in process.env');
    }

    return process.env[key];
  }
}