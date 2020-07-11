export type Chainer<T> = {
  (): Promise<T>;
  get: () => {
    _chain: string[];
    (): Promise<T>;
  };
};
export type ChainedConfig<T> = ChainableSchema<T> & Chainer<T>
export type ChainableSchema<T> = {
  [P in keyof T]: ChainedConfig<T[P]>;
};