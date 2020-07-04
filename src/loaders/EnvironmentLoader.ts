import { ILoader } from '../types';
import { ValueNotSetError } from '../errors';

/**
 * Load environment variables
 */
export class EnvironmentLoader implements ILoader<string> {

  async load(key: string): Promise<string> {
    if (!(key in process.env)) {
      throw new ValueNotSetError(key, this, 'No key in process.env');
    }

    return process.env[key];
  }
}