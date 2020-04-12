export class FileNotFoundError extends Error {
  constructor(file: string) {
    super(`File not found: ${file}`);
  }
};