import { Options, ILogger, ConfigSchema, IConfigSchemaObj, IConfigValidator } from '../types';
import Ajv from 'ajv';
import { InvalidSchemaError } from '../errors';
import { isConfigSchemaObject } from '../utils/guards';

/**
 * The schema type once converted to json schema for validation
 */
interface ISchemaProperties {
  [k: string]: {
    type: string;
    properties?: ISchemaProperties;
  };
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
   * Get the json schema properties for the config schema
   * @param schema 
   */
  private getSchemaProperties<T>(schema: ConfigSchema<T>): ISchemaProperties {
    const properties: ISchemaProperties = {};
    for (const key in schema) {
      if (!schema.hasOwnProperty(key)) {
        continue;
      }

      properties[key] = {
        type: 'object',
      };

      let type: string;
      if (typeof schema[key] !== 'object') {
        this.logger.info(`Schema under ${key} should be an object`);
        throw new InvalidSchemaError(`Schema under ${key} should be an object`);
      }

      // Check if we are defining the type
      // Otherwise it's a nested object
      const schemaValue = schema[key];
      if (isConfigSchemaObject(schemaValue)) {
        type = this.getType(schemaValue);
      } else {
        // Recursively build properties
        properties[key].properties = this.getSchemaProperties(schema[key] as ConfigSchema<T[keyof T]>);
      }

      properties[key].type = type;
    }

    return properties;
  }

  /**
   * Cast the schema value to the _type cast specified in the schema object
   * @param schema 
   * @param value 
   */
  public cast<T>(schema: IConfigSchemaObj<T>, value: T): any {
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

  /**
   * Validate a specific value against it's schema
   * @param schema
   * @param value
   */
  public async validate<T>(schema: IConfigSchemaObj<T>, value: T): Promise<boolean> {
    const jsonSchema = this.getSchemaProperties(schema);

    const test = this.ajv.compile(jsonSchema);
    
    if (!test(value)) {
      throw new InvalidSchemaError('Value failed validation', test.errors);
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
      throw new InvalidSchemaError('Config failed validation', test.errors);
    }
    
    return true;
  }
}