import { ConfigStore } from '../ConfigStore';
import { ConfigValue } from '../ConfigValue';
import { InvalidSchemaError, ValueNotSetError } from '../errors';
import { Options, ILogger, IConfigLoader, IResolver, ILoader, IConfigValidator } from '../types';

export class ConfigLoader implements IConfigLoader {
  private logger: ILogger;
  private loaderResolver: IResolver<ILoader>;
  private validator: IConfigValidator;

  constructor(options: Options.IConfigLoaderOptions) {
    this.logger = options.logger;
    this.loaderResolver = options.loaderResolver;
    this.validator = options.validator;
  }

  public async load(key: string, config: ConfigValue | ConfigStore): Promise<ConfigValue | ConfigStore> {
    if (config instanceof ConfigValue) {
      const keySchema = config.getSchema();
      const src = keySchema._source;
      const srcKey = keySchema._key || key;

      if (!src || !srcKey) {
        // Can't load from an external source, if we have a default then fine, otherwise this is a schema error
        if (config.hasDefaultBeenSet()) {
          return config;
        }

        throw new InvalidSchemaError(
          `No _source & _key specified for key: ${key}, either specify a default, use environment files or define the _source & _key.`
        );
      }

      try {
        // Load, validate and set the value from the external source
        let value = await this.loadFromSource(src, srcKey);
  
        this.logger.debug(`Loaded key (${srcKey}) from source`);
  
        // TODO: MOVE CASTING LOGIC
        value = this.validator.cast(keySchema, value);
  
        await this.validator.validate(keySchema, value);
        config.setValue(value);
      } catch (e) {
        if (e instanceof ValueNotSetError) {
          this.logger.debug(`No value set in loader for (${srcKey})`);
          return config;
        }
  
        throw e;
      }
    } else {
      await config.each(this.load.bind(this));
      config.setValue({});
    }

    return config;
  }

  /**
   * Load a key from a specific source
   * @param source 
   * @param key 
   */
  public async loadFromSource(source: string, key: string): Promise<any> {
    const loader = await this.loaderResolver.resolve(source);
    return loader.load(key);
  }
}