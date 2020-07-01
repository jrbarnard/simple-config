// tslint:disable: no-console
import { ConfigSchema, Config, Source } from '../../src';

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
  // Load a basic config file with just the feature flags
  const config = new Config<IBasicConfigSchema>(schema);
  await config.loadConfigFile('testing', [__dirname, 'config'].join('/'));

  try {
    await config.get('services.google.apiKey')
  } catch (e) {
    // Will throw a KeyLoadingError as there is no default
    console.log(e.name);
  }

  process.env.GOOGLE_API_KEY = '123456789';
  console.log(await config.get('services.google.apiKey')); // 123456789
  console.log(await config.get('featureFlags.newForm')) // true;
})();