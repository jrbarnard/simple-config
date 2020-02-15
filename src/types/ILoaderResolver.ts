import { ILoader } from './ILoader';

export interface ILoaderResolver {
  resolve(loader: string): ILoader;
}