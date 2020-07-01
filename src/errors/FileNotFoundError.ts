export class FileNotFoundError extends Error {
  name = 'FileNotFoundError';
  constructor(file: string) {
    super(`File not found: ${file}`);
  }
};