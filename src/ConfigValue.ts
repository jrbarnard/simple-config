import { IConfigSchemaObj } from './types';
import { ValueBase } from './ValueBase';

export class ConfigValue extends ValueBase {
  private isDefaultSet = false;

  constructor(private schema: IConfigSchemaObj<any>) {
    super();
    if ('_default' in this.schema) {
      this.setDefault(this.schema._default);
    }
  }

  public getSchema(): IConfigSchemaObj<any> {
    return this.schema;
  }

  public setDefault<T>(value: T): this {
    this.isDefaultSet = true;
    this.value = value;
    return this;
  }

  /**
   * Differentiate so we know when to override or not
   * E.g if loaded by schema _default, then overridden by a prod.json file
   * But if the source is set as Source.Environment then we should still override
   */
  public hasDefaultBeenSet(): boolean {
    return this.isDefaultSet;
  }
}