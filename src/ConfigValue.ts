import { ValueBase } from './ValueBase';
import { IConfigSchemaObj } from './types';

// TODO: REFACTOR OUT?
export class ConfigValue extends ValueBase {
  constructor(private schema: IConfigSchemaObj<any>) {
    super();
    if ('_default' in this.schema) {
      this.setDefault(this.schema._default);
    }
  }

  public getSchema(): IConfigSchemaObj<any> {
    return this.schema;
  }
}