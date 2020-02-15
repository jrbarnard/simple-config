export interface ILoader {
  load(key: string): Promise<any>;
}

export interface ILoaders {
  [k: string]: ILoader;
}

export interface ILoaderConstructors {
  [k: string]: new (options: any) => ILoader
}