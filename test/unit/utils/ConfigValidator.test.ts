import { ConfigValidator } from '../../../src/utils/ConfigValidator';
import { ILogger } from '../../../src/types';

describe('ConfigValidator.cast', () => {
  let validator: ConfigValidator;
  const mockLogger = jest.fn() as unknown as jest.Mocked<ILogger>;

  beforeEach(() => {
    validator = new ConfigValidator({
      logger: mockLogger
    });
  })
  describe.each([
    ['a string', 'a string'],
    ['123', '123'],
    [123, '123'],
    [{}, '[object Object]'],
    [true, 'true'],
    [false, 'false'],
  ])('When passed String schema', (value, expected) => {
    it('Will cast to string', () => {
      expect(validator.cast({
        _type: String,
      }, value)).toBe(expected);
    });
  });

  describe.each([
    ['a string', NaN],
    ['123', 123],
    [123, 123],
    [123.91, 123.91],
    ['123.22', 123.22],
    [true, 1],
    [false, 0],
    [{}, NaN]
  ])('When passed Number schema', (value, expected) => {
    it('Will cast to number', () => {
      expect(validator.cast({
        _type: Number,
      }, value)).toBe(expected);
    });
  });

  describe.each([
    [false, false],
    [true, true],
    ['true', true],
    ['false', false],
    [0, false],
    [1, true],
    ['0', false],
    ['1', true],
    ['anythingelse', true],
    [{}, true]
  ])('When passed Boolean schema', (value, expected) => {
    it('Will cast to bool', () => {
      expect(validator.cast({
        _type: Boolean,
      }, value)).toBe(expected);
    });
  });

  describe.each([
    [false],
    [{}],
    [[]],
    ['test'],
    [123]
  ])('When passed another schema', (value) => {
    it('Will not cast', () => {
      expect(validator.cast({
        _type: 'something' as any,
      }, value)).toBe(value);
    });
  });
});