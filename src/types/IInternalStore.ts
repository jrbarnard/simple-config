import { ConfigValue } from '../ConfigValue';
import { ConfigStore } from '../ConfigStore';

export interface IInternalStore {
  [k: string]: ConfigStore | ConfigValue;
};