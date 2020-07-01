// tslint:disable: no-console

import { ConfigSchema, Config, Source, LogLevel } from '../../src';
import { Logger } from '../../src/utils/Logger';

interface IBasicConfigSchema {
  services: {
    google: {
      apiKey: string,
    },
  },
  featureFlags: {
    newForm: boolean;
  }
};

const schema: ConfigSchema<IBasicConfigSchema> = {
  services: {
    google: {
      apiKey: {
        _type: String,
        _key: 'GOOGLE_API_KEY',
        _source: Source.Environment
      }
    }
  },
  featureFlags: {
    newForm: {
      _type: Boolean,
      _default: false
    }
  }
};

(async () => {
  // No environment set
  let config = new Config<IBasicConfigSchema>();
  await config.initialise(schema);

  try {
    await config.get('services.google.apiKey')
  } catch (e) {
    // Will throw a KeyLoadingError as there is no default
    console.log(e.name);
  }

  process.env.GOOGLE_API_KEY = '123456789';
  console.log('Google api key: ', await config.get('services.google.apiKey'));

  // Defaults to false due to definition above
  console.log('New form feature flag: ', await config.get('featureFlags.newForm'));

  // Specified environment which has an environment file
  config = new Config<IBasicConfigSchema>({
    environment: 'testing',
    configDirectory: [__dirname, 'config'].join('/')
  });
  await config.initialise(schema);

  // Now will be true as set to true in ./config/testing.json
  console.log('New form feature flag: ', await config.get('featureFlags.newForm'));
})();