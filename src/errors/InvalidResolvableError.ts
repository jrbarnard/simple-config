export class InvalidResolvableError extends Error {
  name = 'InvalidResolvableError';
  constructor(key: string) {
    super(`Resolvable ${key} is invalid, it may need defining.`);
  }
}