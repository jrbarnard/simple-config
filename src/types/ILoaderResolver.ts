import { ILoader } from './ILoader';

export interface ILoaderResolver {
  resolve(loader: string): Promise<ILoader>;
  addLoader(loaderKey: string, loader: ILoader): void;
}