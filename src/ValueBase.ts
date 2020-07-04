export abstract class ValueBase {
  protected isSet = false;
  protected value: any = undefined;

  public getValue<T>(): T {
    return this.value;
  }

  public setValue<T>(value: T): this {
    this.isSet = true;
    this.value = value;
    return this;
  }

  public hasBeenSet(): boolean {
    return this.isSet;
  }
}