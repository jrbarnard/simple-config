/**
 * The abstract of a class that will hold a config value
 */
export abstract class ValueBase {
  protected isSet = false;
  protected value: any = undefined;
  protected defaultValue: any = undefined;
  protected isDefaultSet = false;

  public getValue<T>(): T {
    return this.hasBeenSet() ? this.value : this.getDefaultValue();
  }

  public setValue<T>(value: T): this {
    this.isSet = true;
    this.value = value;
    return this;
  }

  public hasBeenSet(): boolean {
    return this.isSet;
  }

  public setDefault<T>(value: T): this {
    this.isDefaultSet = true;
    this.defaultValue = value;
    return this;
  }

  public getDefaultValue<T>(): T {
    return this.defaultValue;
  }

  /**
   * Differentiate so we know when to override or not
   * E.g if loaded by schema _default, then overridden by a prod.json file
   * But if the source is set as Source.Environment then we should still override
   */
  public hasDefaultBeenSet(): boolean {
    return this.isDefaultSet;
  }

  public unset(): this {
    this.isSet = false;
    this.value = undefined;
    return this;
  } 
}