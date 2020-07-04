export interface IHasValue {
  hasBeenSet(): boolean;
  getValue<C>(defaultValue: C): C;
  getValue<C>(): C;
  setValue<C>(value: C): this;
}