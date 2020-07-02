import { Config } from '../../src/Config';
import { ConfigSchema, Source, ILoader, LogLevel } from '../../src/types';
import { KeyLoadingError, SchemaValidationError } from '../../src/errors';
import { Logger } from '../../src/utils/Logger';

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
  level: LogLevel.Error
});

describe('Config', () => {
  describe('When environment passed', () => {
    it('Will set the values found in environment files', async () => {
      let config = new Config<ITestConfigSchema>(schema, {
        logger
      });
      await config.loadConfigFile('dev', configDirectory);

      let result = await config.get('db');
      expect(result).toEqual({
        host: 'localhost', // From default in schema
        password: 'localtesting', // Overridden in dev.json
        port: 1111, // Overridden in dev.json
        nested: {
          test: 'dev override', // Overridden in dev.json
        },
      });

      // As no password in stage, if we try to load it will fail, so we need to set in process.env
      process.env.DB_PASSWORD = 'PROCESS_PASSWORD';
      config = new Config<ITestConfigSchema>(schema, {
        logger
      });
      await config.loadConfigFile('stage', configDirectory);

      result = await config.get('db');
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
  describe('When value not set and does not have a default', () => {
    beforeEach(() => {
      delete process.env.DB_PASSWORD;
    });
    it('Will throw an error', async () => {
      const config = new Config<ITestConfigSchema>(schema, {
        logger
      });
      // No config file loaded

      await expect(config.get('db.password')).rejects.toThrow(KeyLoadingError);
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
    })
  });
});