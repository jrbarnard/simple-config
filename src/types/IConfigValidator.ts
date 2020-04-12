import { IConfigSchemaObj } from './ConfigSchema';

export interface IConfigValidator {
  validate<T>(schema: IConfigSchemaObj<T>, value: T): Promise<boolean>;
  cast<T>(schema: IConfigSchemaObj<T>, value: any): any;
}