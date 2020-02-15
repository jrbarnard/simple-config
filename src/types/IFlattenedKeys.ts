import { ConfigValue } from '../ConfigValue';
import { ConfigStore } from '../ConfigStore';

export interface IFlattenedKeys {
  [k:string]: ConfigStore | ConfigValue;
}