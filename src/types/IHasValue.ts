export interface IHasValue {
  /**
   * Has the value been set yet?
   */
  hasBeenSet(): boolean;
  /**
   * Get the stored value
   */
  getValue<C>(): C | undefined;
  /**
   * Set the value to the passed value, this should also cause hasBeenSet to return true
   * @param value 
   */
  setValue<C>(value: C): this;
}