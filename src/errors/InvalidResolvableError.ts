export class InvalidResolvableError extends Error {
  constructor(key: string) {
    super(`Resolvable ${key} is invalid, it may need defining.`);
  }
}