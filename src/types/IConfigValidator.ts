import { IConfigSchemaObj, ConfigSchema } from './ConfigSchema';

export interface IConfigValidator {
  validate<T>(schema: IConfigSchemaObj<T>, value: T): Promise<boolean>;
  validate<T>(schema: ConfigSchema<T>, value: Partial<T>): Promise<boolean>;
  cast<T>(schema: IConfigSchemaObj<T>, value: any): any;
}