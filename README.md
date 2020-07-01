# Simple Config

## Features

- Interface defined Config
- Supports environment config files
- Lazy loading config from external sources (e.g SSM)
- Supports environment variable & SSM as config sources out of the box
- Extensible - easy to add new config loaders to load from a variety of sources
- Will cast and validate config against your expected config schema

## Usage

1. Define your schema
```
import { ConfigSchema, Source } from '@jrbarnard/simple-config';

// Typescript interface to describe the structure and types of the config variables
interface IAppConfig {
  db: {
    host: string;
    port: number;
    user: {
      name: string;
      password: string;
    }
  },
  services: {
    googleMaps: {
      apiKey: string;
    },
  }
};

// Config schema definition, to define how the config should be loaded
const schema: ConfigSchema<IAppConfig> = {
  db: {
    host: {
      // No external source set, will use default or the value set in the relevant environment file (if loaded)
      _default: 'localhost',
      _type: String
    },
    port: {
      _type: Number,
      // Will load from the built in environment variable loader
      _source: Source.Environment,
      // process.env.DB_PORT
      _key: 'DB_PORT',
      _default: 3306
    },
    user: {
      password: {
        _type: String,
        // Will load from the built in environment variable loader
        // process.env.DB_PASSWORD
        _source: Source.Environment,
        _key: 'DB_PASSWORD'
      },
      name: {
        _type: String,
        _default_: 'user'
      }
    }
  },
  services: {
    googleMaps: {
      apiKey: {
        _type: String,
        // Will load from the built in SSM loader
        _source: Source.SSM,
        _key: 'GOOGLE_MAPS_API_KEY',
      }
    },
  }
};

```
2. Load your schema into a config object
```
const config = new Config<IAppConfig>(schema);

// Optionally load a config file (can be useful for local development / a set of defaults per environment)
await config.loadConfigFile(process.env.NODE_ENV);
```
3. Use the config
```
// Retrieve a group of config
const dbConfig = await config.get('db');
// { host: '127.0.0.1', port: 3306, user: { password: '123456', name: 'superuser' } }

// Retrieve a single item of config
const dbPort = await config.get('db.port');
// 3306
```

## Roadmap

- Casting data on way in from external sources based on schema
- Tests & Clean up
- Improve SSM loader to decrypt values
- Events (hook into set up & see when config variables change / are requested)
- External caching?