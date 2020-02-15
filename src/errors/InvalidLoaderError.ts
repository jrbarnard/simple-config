export class InvalidLoaderError extends Error {
  constructor(loader: string) {
    super(`Loader ${loader} is invalid, it may need defining.`);
  }
}