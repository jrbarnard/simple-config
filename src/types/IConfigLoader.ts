export interface IConfigLoader {
  loadFromSource(source: string, key: string): Promise<any>;
}