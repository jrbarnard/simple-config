// TODO:
// Loads defaults from files based on environment
// Overrides with source based config
// Will load async on deman
// Will validate config & throw if invalid
// Custom loaders

// REFACTOR

// Add config casting

import { Config } from '../../src/Config';
import { ConfigSchema, Source } from '../../src/types';

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
  }
};

describe('Config', () => {
  describe('When environment passed', () => {
    it('Will set the values found in environment files', async () => {
      let config = new Config<ITestConfigSchema>({
        environment: 'dev',
        configDirectory: 'test/integration/config'
      });
      await config.initialise(schema);

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
      config = new Config<ITestConfigSchema>({
        environment: 'stage',
        configDirectory: 'test/integration/config'
      });
      await config.initialise(schema);

      result = await config.get('db');
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