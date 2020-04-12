import { Options, ILogger, ConfigSchema, IConfigSchemaObj, IConfigValidator } from '../types';
import Ajv from 'ajv';
import { SchemaValidationError, InvalidSchemaError } from '../errors';
import { isConfigSchemaObject } from '../utils/guards';
import { ConfigSchemaValue } from '../types/ConfigSchema';

interface ISchemaProperty {
  type: string;
  properties?: ISchemaProperties;
}

/**
 * The schema type once converted to json schema for validation
 */
interface ISchemaProperties {
  [k: string]: ISchemaProperty;
}

/**
 * A validator that can convert and validate config schemas into json schema
 */
export class ConfigValidator implements IConfigValidator {
  private logger: ILogger;
  private ajv: Ajv.Ajv;

  constructor(options: Options.IConfigValidatorOptions) {
    this.logger = options.logger;
    this.ajv = new Ajv();
  }

  /**
   * Get the string representation of the allowed type from the config schema object
   * This type matches up to JSON schema properties
   * @param schema 
   */
  private getType<T>(schema: IConfigSchemaObj<T>): string {
    let type: string;

    switch (schema._type) {
      case String:
        type = 'string';
        break;
      case Number:
        type = 'number';
        break;
      case Boolean:
        type = 'boolean';
        break;
    }

    if (!type) {
      this.logger.info('No _type found on schema');
      throw new InvalidSchemaError('No _type found on schema')
    }

    return type;
  }

  /**
   * Gets a single schema object json schema property object
   * @param schemaValue 
   */
  private getSchemaProperty<T>(schemaValue: ConfigSchemaValue<T>): ISchemaProperty {
    const properties: ISchemaProperty = {
      type: 'object',
    };

    if (typeof schemaValue !== 'object') {
      throw new InvalidSchemaError(`Schema should be an object`);
    }

    // Check if we are defining the type
    // Otherwise it's a nested object
    if (isConfigSchemaObject(schemaValue)) {
      properties.type = this.getType(schemaValue);
    } else {
      // Recursively build properties
      properties.properties = this.getSchemaProperties(schemaValue);
    }

    return properties;
  }

  /**
   * Get the json schema properties for the config schema
   * @param schema 
   */
  private getSchemaProperties<T>(schema: ConfigSchema<T>): ISchemaProperties {
    const properties: ISchemaProperties = {};
    for (const key in schema) {
      if (!schema.hasOwnProperty(key)) {
        continue;
      }

      properties[key] = this.getSchemaProperty(schema[key]);
    }

    return properties;
  }

  /**
   * Cast the schema value to the _type cast specified in the schema object
   * @param schema 
   * @param value 
   */
  public cast<T>(schema: IConfigSchemaObj<T>, value: any): any {
    switch (schema._type) {
      case String:
        return String(value);
      case Number:
        return Number(value);
      case Boolean:
        const flaseyValues: any[] = [
          'false',
          '0',
          0,
          false
        ];
        return !flaseyValues.includes(value);
    }

    return value;
  }

  private runAdditionalValidation(schema: ISchemaProperty, value: any): boolean {
    if (schema.type === 'number') {
      // Do not allow NaN
      if (isNaN(value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate a specific value against it's schema
   * @param schema
   * @param value
   */
  public async validate<T>(schema: IConfigSchemaObj<T>, value: T): Promise<boolean> {
    const jsonSchema = this.getSchemaProperty(schema);

    const test = this.ajv.compile(jsonSchema);
    
    if (!test(value) || !this.runAdditionalValidation(jsonSchema, value)) {
      throw new SchemaValidationError('Value failed validation', test.errors);
    }

    return true;
  }

  /**
   * Validates a full set of ConfigSchema
   * @param schema 
   * @param config 
   */
  public async validateFull<T>(schema: ConfigSchema<T>, config: Partial<T>): Promise<boolean> {
    this.logger.debug('Validating schema config');

    // Build schema for entire schema
    const jsonSchema: any = {
      type: 'object',
      properties: this.getSchemaProperties(schema)
    };

    const test = this.ajv.compile(jsonSchema);
    const isValid = test(config);

    if (!isValid) {
      this.logger.info(`Failed validation: ${JSON.stringify(test.errors)}`);
      throw new SchemaValidationError('Config failed validation', test.errors);
    }
    
    return true;
  }
}