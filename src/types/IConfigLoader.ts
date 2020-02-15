import { Source } from './Source';

export interface IConfigLoader {
  loadFromSource(source: Source, key: string): Promise<any>;
}