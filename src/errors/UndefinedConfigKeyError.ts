export class UndefinedConfigKeyError extends Error {
  constructor(key: string) {
    super(`Undefined config key: ${key}`);
  }
}