import Ajv, { ErrorObject, SchemaValidateFunction } from 'ajv';
import { SchemaValidationError, InvalidSchemaError } from '../errors';
import { isConfigSchemaObject } from '../utils/guards';
import { Options, ILogger, ConfigSchema, IConfigSchemaObj, ConfigSchemaValue, IConfigValidator } from '../types';

interface ISchemaProperty {
  type: string;
  properties?: ISchemaProperties;
  [k: string]: any;
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
    this.ajv = new Ajv({
      allErrors: true
    });

    this.extendAjv();
  }

  private extendAjv(): void {
    const validateNaN: SchemaValidateFunction = (schema: any, data: any, parentSchema: any, dataPath: any) => {
      if (!parentSchema.NaN) {
        return true;
      }

      if (!isNaN(data)) {
        return true;
      }

      validateNaN.errors = [];
      validateNaN.errors.push({
        keyword: 'type',
        dataPath,
        params: { NaN: parentSchema.NaN },
        schemaPath: undefined,
        message: 'should be number'
      });

      return false;
    }

    // Add support to verify NaN returns invalid
    this.ajv.addKeyword('NaN', {
      type: 'number',
      validate: validateNaN,
      errors: true
    });
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
      type: 'object'
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

    // Add additional keywords / properties depending on type & schema
    if (properties.type === 'number') {
      properties.NaN = true;
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
      case Boolean: {
        const flaseyValues: any[] = [
          'false',
          '0',
          0,
          false
        ];
        return !flaseyValues.includes(value);
      }
    }

    return value;
  }

  public async validate<T>(schema: IConfigSchemaObj<T>, value: T): Promise<boolean>;
  public async validate<T>(schema: ConfigSchema<T>, value: Partial<T>): Promise<boolean>;

  /**
   * Validate a specific value against it's schema
   * @param schema
   * @param value
   */
  public async validate<T>(schema: IConfigSchemaObj<T> | ConfigSchema<T>, value: T | Partial<T>): Promise<boolean> {
    let jsonSchema: ISchemaProperty;

    if (!isConfigSchemaObject(schema)) {
      jsonSchema = {
        type: 'object',
        properties: this.getSchemaProperties(schema)
      }
    } else {
      jsonSchema = this.getSchemaProperty(schema);
    }

    const test = this.ajv.compile(jsonSchema);
    let errors: ErrorObject[] = [];
    
    if (!test(value)) {
      errors = test.errors;
    }

    if (errors.length > 0) {
      this.logger.info(`Failed validation: ${JSON.stringify(test.errors)}`);
      throw new SchemaValidationError('Value failed validation', errors);
    }

    return true;
  }
}