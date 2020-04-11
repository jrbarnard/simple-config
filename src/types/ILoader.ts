export interface ILoader<T = any> {
  load(key: string): Promise<T>;
}

export interface ILoaders {
  [k: string]: ILoader;
}

export interface ILoaderConstructors {
  [k: string]: new (options: any) => ILoader
}