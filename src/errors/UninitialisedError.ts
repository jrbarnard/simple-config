export class UninitialisedError extends Error {
  name = 'UninitialisedError';
  constructor(message: string = 'Config not yet initialised. call config#initialise(schema)') {
    super(message);
  }
}