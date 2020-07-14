import { ValueBase } from './ValueBase';
import { IConfigSchemaObj } from './types';

export class ConfigValue<T> extends ValueBase<T> {
  constructor(private schema: IConfigSchemaObj<T>) {
    super();
    if ('_default' in this.schema) {
      this.setDefault(this.schema._default);
    }
  }

  public getSchema(): IConfigSchemaObj<T> {
    return this.schema;
  }
}