import { ErrorObject } from 'ajv';

export class SchemaValidationError extends Error {
  name = 'SchemaValidationError';
  private errors: ErrorObject[];
  constructor(message: string, errors: ErrorObject[] = []) {
    super(message);
    this.errors = errors;
  }

  getErrors(): ErrorObject[] {
    return this.errors;
  }
}