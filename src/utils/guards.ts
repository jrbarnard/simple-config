import { ConfigSchemaValue, IConfigSchemaObj } from '../types/ConfigSchema';

/**
 * Type guard to work out if it's a config schema object
 * @param schemaObject 
 */
export const isConfigSchemaObject = <T>(schemaObject: ConfigSchemaValue<T>): schemaObject is IConfigSchemaObj<T> => {
  return '_type' in schemaObject;
};