// tslint:disable: no-console
import { ConfigSchema, Config, Source } from '../../src';

interface IServicesSchema {
  google: {
    apiKey: string;
  };
}
interface IBasicConfigSchema {
  services: IServicesSchema;
  featureFlags: {
    newForm: boolean;
  };
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
  const config = new Config(schema);
  await config.loadConfigFile('testing', [__dirname, 'config'].join('/'));

  try {
    await config.get<string>('services.google.apiKey')
  } catch (e) {
    // Will throw a KeyLoadingError as there is no default
    console.log(e.name);
  }

  process.env.GOOGLE_API_KEY = '123456789';
  console.log(await config.get<IServicesSchema>('services')); // { google: { apiKey: '123456789' } }
  console.log(await config.get<string>('services.google.apiKey')); // '123456789'
  console.log(await config.get<boolean>('featureFlags.newForm')) // true;
})();