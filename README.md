# Simple Config

## Features

- Interface defined Config
- Environment config files
- Multiple data source config files
- Lazy loading config from external sources (e.g SSM)
- Ability to add custom loaders for other external sources
- Can cast and validate config

## Usage

1. Define your schema
```
interface IAppConfig {
  // When a build in loader is resolved for the first time it will be injected with the config under loaders and it's key
  // E.g here it will inject the region
  loaders: {
    ssm: {
      region: string;
    }
  },
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

// Config schema definition
export const schema: ConfigSchema<IAppConfig> = {
  db: {
    host: {
      // No external source set, will use default or the value set in the relevant environment file
      _default: 'localhost',
      _type: String
    },
    port: {
      _type: Number,
      _source: Source.Environment,
      _key: 'DB_PORT',
      _default: 3306
    },
    user: {
      password: {
        _type: String,
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
        _source: Source.SSM,
        _key: 'GOOGLE_MAPS_API_KEY',
      }
    },
  }
};

```

// TODO: CONTINUE

## Roadmap

- Casting data on way in from external sources based on schema
- Tests & Clean up
- Improve SSM loader to decrypt values
- Events (hook into set up & see when config variables change / are requested)
- External caching?