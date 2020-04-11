export interface ILoader<T = any> {
  load(key: string): Promise<T>;
}