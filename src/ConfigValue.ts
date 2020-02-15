export class ConfigValue {
  private value: any = undefined;
  private isSet: boolean = false;
  private isDefaultSet: boolean = false;

  public getValue(): any {
    return this.value;
  }

  public setValue(value: any) {
    this.isSet = true;
    this.value = value;
  }

  public setDefault(value: any) {
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