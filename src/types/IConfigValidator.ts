import { IConfigSchemaObj } from './ConfigSchema';

export interface IConfigValidator {
  validate(schema: IConfigSchemaObj<any>, value: any): Promise<boolean>;
  cast(schema: IConfigSchemaObj<any>, value: any): any;
}