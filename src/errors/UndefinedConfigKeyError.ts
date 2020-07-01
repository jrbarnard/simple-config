export class UndefinedConfigKeyError extends Error {
  name = 'UndefinedConfigKeyError';
  constructor(key: string) {
    super(`Undefined config key: ${key}`);
  }
}