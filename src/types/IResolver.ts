export type ResolvableConstructor<T> = new (options: any) => T;

export interface IResolvableConstructors<T>{
  [k: string]: ResolvableConstructor<T>;
}

export interface IResolver<T> {
  resolve(key: string): Promise<T>;
  add(key: string, instance: T): void;
  register(key: string, resolvableConstructor: ResolvableConstructor<T>): void;
}