import { ILoader } from '../types';

// TODO: Set up
export class SSMLoader implements ILoader {
  async load(key: string): Promise<any> {
    return 'SOME_SSM_VAR' + key;
  }
}