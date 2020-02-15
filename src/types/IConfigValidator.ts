import { IConfigSchemaObj } from './ConfigSchema';

export interface IConfigValidator {
  validate(schema: IConfigSchemaObj, value: any): Promise<boolean>;
  cast(schema: IConfigSchemaObj, value: any): any;
}