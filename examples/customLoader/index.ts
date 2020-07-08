import { ConfigSchema, Config, ILoader } from '../../src';

interface ICustomLoaderConfigSchema {
  twitter: {
    baseUrl: string;
    apiKey: string;
  },
};

const schema: ConfigSchema<ICustomLoaderConfigSchema> = {
  twitter: {
    baseUrl: {
      _type: String,
      _default: 'https://api.twitter.com'
    },
    apiKey: {
      _type: String,
      _source: 'customloader',
      _key: 'TWITTER_API_KEY'
    }
  }
};

/**
 * A custom loader that will just return back a basic string
 * These can be implemented for your config sources of choice.
 * E.g yml files, external url's, external config services
 */
class CustomLoader implements ILoader<string> {
  public async load(key: string): Promise<string> {
    return `${key}-somevalue`;
  }
}

(async () => {
  const config = new Config(schema);

  config.addLoader('customloader', new CustomLoader());

  console.log(`services.twitter.baseUrl: ${await config.chain.twitter.baseUrl()}`); // https://api.twitter.com
  console.log(`services.twitter.apiKey: ${await config.chain.twitter.apiKey()}`); // TWITTER_API_KEY-somevalue
})();