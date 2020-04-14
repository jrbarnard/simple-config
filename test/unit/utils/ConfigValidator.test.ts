import { ConfigValidator } from '../../../src/utils/ConfigValidator';
import { ConfigSchema } from '../../../src/types';
import { SchemaValidationError } from '../../../src/errors';
import { createMockLogger } from '../testHelpers/mockLogger';

let validator: ConfigValidator;
const mockLogger = createMockLogger();

beforeEach(() => {
  validator = new ConfigValidator({
    logger: mockLogger
  });
});

describe('ConfigValidator.cast', () => {
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

describe('ConfigValidator.validate', () =>  {
  describe('When schema is string', () => {
    it.each([
      123,
      999.99,
      {},
      [],
      true,
      false
    ])('Will throw when invalid (%s)', async (invalid)  => {
      expect.assertions(3);
      try {
        await validator.validate({
          _type: String,
        }, invalid);
      } catch(e) {
        expect(e).toBeInstanceOf(SchemaValidationError);
        const errors = e.getErrors();
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toEqual('should be string');
      }
    });

    it.each([
      '',
      'valid string'
    ])('Will pass when valid (%s)', async (valid)  => {
      await expect(validator.validate({
        _type: String,
      }, valid)).resolves.toEqual(true);
    });
  });

  describe('When schema is number', () => {
    it.each([
      NaN,
      '',
      'nope',
      true,
      false,
      [],
      {}
    ])('Will throw when invalid (%s)', async (invalid)  => {
      expect.assertions(3);
      try {
        await validator.validate({
          _type: Number,
        }, invalid);
      } catch(e) {
        expect(e).toBeInstanceOf(SchemaValidationError);
        const errors = e.getErrors();
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toEqual('should be number');
      }
    });

    it.each([
      -111,
      0,
      1,
      999,
      111.111
    ])('Will pass when valid (%s)', async (valid)  => {
      await expect(validator.validate({
        _type: Number,
      }, valid)).resolves.toEqual(true);
    });
  });

  describe('When schema is boolean', () => {
    it.each([
      {},
      123,
      1,
      0,
      'true',
      'false',
      []
    ])('Will throw when invalid (%s)', async (invalid)  => {
      expect.assertions(3);
      try {
        await validator.validate({
          _type: Boolean,
        }, invalid);
      } catch(e) {
        expect(e).toBeInstanceOf(SchemaValidationError);
        const errors = e.getErrors();
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toEqual('should be boolean');
      }
    });

    it.each([
      true,
      false
    ])('Will pass when valid (%s)', async (valid)  => {
      await expect(validator.validate({
        _type: Boolean,
      }, valid)).resolves.toEqual(true);
    });
  });

  describe('When schema is object', () => {
    const testSchema: ConfigSchema<{
      key: string;
      hello: number;
      anotherNumber: number;
      world: boolean;
    }> = {
      key: {
        _type: String
      },
      hello: {
        _type: Number
      },
      anotherNumber: {
        _type: Number
      },
      world: {
        _type: Boolean
      }
    };
    describe('When passed invalid data', () => {
      it('Will throw', async  () => {
        expect.assertions(3);
        try {
          await validator.validate(testSchema, {
            key: 123,
            hello: NaN,
            anotherNumber: 'nope',
            world: 'notaboolean'
          } as any);
        } catch(e) {
          expect(e).toBeInstanceOf(SchemaValidationError);
          const errors = e.getErrors();
          expect(errors).toHaveLength(4);
          expect(errors).toEqual([{
            keyword: 'type',
            dataPath: '.key',
            schemaPath: '#/properties/key/type',
            params: { type: 'string' },
            message: 'should be string'
          },
          {
            keyword: 'type',
            dataPath: '.hello',
            schemaPath: '#/properties/hello/NaN',
            params: { NaN: true },
            message: 'should be number'
          },
          {
            keyword: 'type',
            dataPath: '.anotherNumber',
            schemaPath: '#/properties/anotherNumber/type',
            params: { type: 'number' },
            message: 'should be number'
          },
          {
            keyword: 'type',
            dataPath: '.world',
            schemaPath: '#/properties/world/type',
            params: { type: 'boolean' },
            message: 'should be boolean'
          }]);
        }
      });
    });

    describe('When passed valid data', () => {
      it('Will pass', async  () => {
        await expect(validator.validate(testSchema, {
          key: 'valid string',
          hello: 1111,
          anotherNumber: 999.99,
          world: false
        })).resolves.toEqual(true);
      });
    });
  });
});