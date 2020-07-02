export class ConfigValue {
  private value: any = undefined;
  private isSet = false;
  private isDefaultSet = false;

  public getValue<T>(): T {
    return this.value;
  }

  public setValue<T>(value: T): void {
    this.isSet = true;
    this.value = value;
  }

  public setDefault<T>(value: T): void {
    this.isDefaultSet = true;
    this.value = value;
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