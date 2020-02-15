export interface ILoader {
  load(key: string): Promise<any>;
}