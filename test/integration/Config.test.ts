import { Config } from '../../src/Config';
import { Logger } from '../../src/utils/Logger';
import { ConfigSchema, Source, ILoader, LogLevel } from '../../src/types';
import { SchemaValidationError, ValueNotSetError, FileNotFoundError, InvalidSchemaError } from '../../src/errors';

interface ITestConfigSchema {
  loaders: {
    custom: {
      hello: string;
    }
  },
  db: {
    host: string;
    password: string;
    port: number;
    nested: {
      test: string;
    }
  },
  services: {
    facebook: {
      apiKey: string;
    },
    wit: {
      apiKey: string;
    }
  },
  customLoaded: {
    aNumber: number;
    aValidNumber: number;
    testString: string;
  }
}

const schema: ConfigSchema<ITestConfigSchema> = {
  // Define config to be used by the loaders in the actual config object
  // TODO: Extract this to be set by default
  loaders: {
    custom: {
      hello: {
        _type: String
      }
    }
  },
  db: {
    host: {
      _default: 'localhost',
      _type: String
    },
    password: {
      _type: String,
      _source: Source.Environment,
      _key: 'DB_PASSWORD'
    },
    port: {
      _type: Number,
      _source: Source.Environment,
      _key: 'DB_PORT',
      _default: 3306
    },
    nested: {
      test: {
        _default: 'hello world',
        _type: String
      }
    }
  },
  services: {
    facebook: {
      apiKey: {
        _type: String,
        _source: Source.SSM,
        _key: 'FACEBOOK_API_KEY',
        _default: 'some default facebook key'
      }
    },
    wit: {
      apiKey: {
        _type: String,
        _source: 'tester',
        _key: 'WIT_API_KEY',
      }
    }
  },
  customLoaded: {
    aNumber: {
      _type: Number,
      _source: 'custom',
      _key: 'CUSTOM_A_NUMBER_KEY',
    },
    aValidNumber: {
      _type: Number,
      _source: 'custom',
      _key: 'CUSTOM_A_VALID_NUMBER_KEY',
      _default: 19101
    },
    testString: {
      _type: String,
      _source: 'custom',
      _key: 'CUSTOM_A_VALID_STRING_KEY',
    }
  }
};

class CustomLoader implements ILoader<any> {
  async load(key: string): Promise<any> {
    const responses: {[k: string]: any} = {
      'CUSTOM_A_NUMBER_KEY': 'not a number',
      'CUSTOM_A_VALID_NUMBER_KEY': '12121212'
    }
    return responses[key];
  }
}
 
const configDirectory = 'test/integration/config';

const logger = new Logger({
  level: LogLevel.Silent
});

describe('Config', () => {
  describe('When value not set and does not have a default', () => {
    beforeEach(() => {
      delete process.env.DB_PASSWORD;
    });
    it('Will throw an error', async () => {
      const config = new Config<ITestConfigSchema>(schema, {
        logger
      });
      await expect(config.get('db.password')).rejects.toThrow(ValueNotSetError);
    });
  });
  describe('When value not set and does have a default', () => {
    let config: Config<ITestConfigSchema>;
    beforeEach(() => {
      delete process.env.DB_PASSWORD;
      config = new Config<ITestConfigSchema>(schema, {
        logger
      });
    });
    describe('And no runtime default is passed', () => {
      it('Will return the default', async () => {
        await expect(config.get('db.port')).resolves.toEqual(3306);
      });
    });
    describe('And a runtime default is passed', () => {
      it('Will return the runtime default', async () => {
        await expect(config.get('db.port', 9999)).resolves.toEqual(9999);
      });
    });
  });
  describe('When value set but does not meet validation', () => {
    it('Will throw an error', async () => {
      const config = new Config<ITestConfigSchema>(schema, {
        logger
      });
      config.addLoader('custom', new CustomLoader());

      // Managed to load, but could not cast to number (NaN), so fails validation
      await expect(config.get('customLoaded.aNumber')).rejects.toThrow(SchemaValidationError);
    });
  });
  describe('When using a custom loader', () => {
    it('Will load from the custom loader', async () => {
      const config = new Config<ITestConfigSchema>(schema, {
        logger
      });
      config.addLoader('custom', new CustomLoader());
  
      await expect(config.get('customLoaded.aValidNumber')).resolves.toEqual(12121212);
    });
    it.each([
      ['customLoaded.testString', 'testing'],
      ['customLoaded', {aNumber: 1212, aValidNumber: 9999, testString: 'testing'}]
    ])('Will load from a custom loader that takes a long time', async (requestedKey, value) => {
      const config = new Config<ITestConfigSchema>(schema, {
        logger
      });
      config.addLoader('custom', new class implements ILoader<any> {
        async load(key: string): Promise<any> {
          const values: {[k: string]: any} = {
            'CUSTOM_A_NUMBER_KEY': 1212,
            'CUSTOM_A_VALID_NUMBER_KEY': 9999,
            'CUSTOM_A_VALID_STRING_KEY': 'testing'
          }
          await new Promise(resolve => {
            setTimeout(resolve, 1000);
          });
          return values[key];
        }
      });
  
      await expect(config.get(requestedKey)).resolves.toEqual(value);
    });
  });

  describe('When loading a config file', () => {
    let config: Config<ITestConfigSchema>;
    beforeEach(() => {
      config = new Config<ITestConfigSchema>(schema, {
        logger
      });
    });
    describe('And the file does not exist', () => {
      it('Will throw an error', async () => {
        await expect(config.loadConfigFile('doesnotexist', configDirectory)).rejects.toThrow(FileNotFoundError);
      });
    });
    describe('And the file is invalid', () => {
      it('Will throw an error', async () => {
        await expect(config.loadConfigFile('invalid', configDirectory)).rejects.toThrow(InvalidSchemaError);
      });
    });
    describe('And the file has the wrong schema', () => {
      it('Will throw an error', async () => {
        await expect(config.loadConfigFile('invalidSchema', configDirectory)).rejects.toThrow(SchemaValidationError);
      });
    });
    describe('And the file has the wrong structure', () => {
      it('Will throw an error', async () => {
        await expect(config.loadConfigFile('invalidStructure', configDirectory)).rejects.toThrow(`Failed to set config for key: "nope", does not exist in schema`);
      });
    });
    describe('And the file is valid', () => {
      it('Will set the values into config', async () => {
        await config.loadConfigFile('dev', configDirectory);
        const result = await config.get('db');
        expect(result).toEqual({
          host: 'localhost', // From default in schema
          password: 'localtesting', // Overridden in dev.json
          port: 1111, // Overridden in dev.json
          nested: {
            test: 'dev override', // Overridden in dev.json
          },
        });
      });
      it('Will allow overriding of the file set config', async () => {
        // As no password in stage, if we try to load it will fail, so we need to set in process.env
        process.env.DB_PASSWORD = 'PROCESS_PASSWORD';
        await config.loadConfigFile('stage', configDirectory);

        const result = await config.get('db');
        delete process.env.DB_PASSWORD;
        expect(result).toEqual({
          host: 'localhost', // From default in schema
          password: 'PROCESS_PASSWORD', // Not set in stage
          port: 2222, // Overridden in stage.json
          nested: {
            test: 'stage override', // Overridden in stage.json
          },
        });
      });
    });
  });
});

describe('Config caching', () => {
  let config: Config<ITestConfigSchema>;
  beforeEach(() => {
    config = new Config<ITestConfigSchema>(schema, {
      logger
    });
  });
  describe('If I request a config value', () => {
    const mockLoad = jest.fn();
    beforeEach(async () => {
      config.addLoader('custom', new class implements ILoader {
        load = mockLoad;
      });

      mockLoad.mockResolvedValue(11111);
      await expect(config.get('customLoaded.aNumber')).resolves.toBe(11111);
    });
    afterEach(() => {
      mockLoad.mockReset();
    });
    describe('And then re request it', () => {
      it('Will not load again', async () => {
        expect(mockLoad).toHaveBeenCalledTimes(1);
        await expect(config.get('customLoaded.aNumber')).resolves.toBe(11111);
        expect(mockLoad).toHaveBeenCalledTimes(1);
        expect(mockLoad).toHaveBeenCalledWith('CUSTOM_A_NUMBER_KEY');
      });
    });
    describe('And then clear the cache before re requesting', () => {
      it('Will load again', async () => {
        expect(mockLoad).toHaveBeenCalledTimes(1);
        config.clear();
        await expect(config.get('customLoaded.aNumber')).resolves.toBe(11111);
        expect(mockLoad).toHaveBeenCalledTimes(2);
        expect(mockLoad).toHaveBeenCalledWith('CUSTOM_A_NUMBER_KEY');
      });
    });
  });
});