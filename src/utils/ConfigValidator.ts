import { Options, ILogger, ConfigSchema, IConfigSchemaObj, IConfigValidator } from '../types';
import Ajv from 'ajv';
import { InvalidSchemaError } from '../errors';

export class ConfigValidator implements IConfigValidator {
  private logger: ILogger;
  private ajv: Ajv.Ajv;
  constructor(options: Options.IConfigValidatorOptions) {
    this.logger = options.logger;
    this.ajv = new Ajv();
  }

  private getType(schema: IConfigSchemaObj): string {
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

  private getSchemaProperties<T>(schema: ConfigSchema<T>) {
    const properties: any = {};
    for (const key in schema) {
      if (!schema.hasOwnProperty(key)) {
        continue;
      }

      properties[key] = {};

      let type: string;
      if (typeof schema[key] !== 'object') {
        this.logger.info(`Schema under ${key} should be an object`);
        throw new InvalidSchemaError(`Schema under ${key} should be an object`);
      }

      // Check if we are defining the type
      // Otherwise it's a nested object
      if ('_type' in schema[key]) {
        const keySchema: IConfigSchemaObj = schema[key] as IConfigSchemaObj;
        type = this.getType(keySchema);
      } else {
        type = 'object';
        // Recursively build properties
        properties[key].properties = this.getSchemaProperties<T[keyof T]>(schema[key] as ConfigSchema<T[keyof T]>);
      }

      properties[key].type = type;
    }

    return properties;
  }

  public cast(schema: IConfigSchemaObj, value: any): any {
    switch (schema._type) {
      case String:
        return String(value);
      case Number:
        return Number(value);
      case Boolean:
        const flaseyValues = [
          'false',
          '0',
          0,
          false
        ];
        return !flaseyValues.includes(value);
    }

    return value;
  }

  public async validate(schema: IConfigSchemaObj, value: any): Promise<boolean> {
    const jsonSchema: any = {
      type: this.getType(schema),
    };

    const test = this.ajv.compile(jsonSchema);
    
    if (!test(value)) {
      throw new InvalidSchemaError('Value failed validation', test.errors);
    }

    return true;
  }

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