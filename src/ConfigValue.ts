import { IConfigSchemaObj, IHasValue } from './types';

export class ConfigValue implements IHasValue {
  private value: any = undefined;
  private isSet = false;
  private defaultValue: any = undefined;
  private isDefaultSet = false;

  constructor(private schema: IConfigSchemaObj<any>) {
    if ('_default' in this.schema) {
      this.setDefault(this.schema._default);
    }
  }

  public getSchema(): IConfigSchemaObj<any> {
    return this.schema;
  }

  public getValue<T>(defaultValue?: T): T {
    if (this.hasBeenSet()) {
      return this.value;
    }

    return defaultValue ? defaultValue : this.getDefault();
  }

  public setValue<T>(value: T): this {
    this.isSet = true;
    this.value = value;
    return this;
  }

  public getDefault<T>(): T {
    return this.defaultValue;
  }

  public setDefault<T>(value: T): this {
    this.isDefaultSet = true;
    this.defaultValue = value;
    return this;
  }

  public hasBeenSet(): boolean {
    return this.isSet;
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