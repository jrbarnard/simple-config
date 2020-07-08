import { ConfigSchema, Config } from '../../src';

interface IChainableConfigSchema {
  a: {
    nested: {
      set: {
        of: string;
        values: string;
      };
      number: number;
    };
  };
};

const schema: ConfigSchema<IChainableConfigSchema> = {
  a: {
    nested: {
      set: {
        of: {
          _type: String,
          _default: 'foo',
        },
        values: {
          _type: String,
          _default: 'bar'
        },
      },
      number: {
        _type: Number,
        _default: 19191
      },
    }
  }
};

(async () => {
  const config = new Config(schema);

  // Start a chain with config.chain
  // Then just call each nested key as a property till you want to retrieve one
  // And call it as a function
  console.log(`a.nested.set.of: ${await config.chain.a.nested.set.of()}`); // 'foo'
  console.log(`a.nested.set: ${JSON.stringify(await config.chain.a.nested.set())}`); // { of: 'foo', values: 'bar' }
  console.log(`a.nested.number: ${await config.chain.a.nested.number()}`); // 19191
})();