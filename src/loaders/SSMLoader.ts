import { KeyLoadingError } from '../errors';
import { ILoader, ILogger, Options, Loaders } from '../types';

/* eslint @typescript-eslint/no-var-requires: 0 */

/**
 * TODO: Decryption
 */
export class SSMLoader implements ILoader {
  private ssm: any;
  private region?: string;
  private logger: ILogger;

  constructor (options: Loaders.ISSMLoaderConfigurableOptions & Options.IExpectsLoggerOptions) {
    this.region = options.region;
    this.logger = options.logger;
  }

  private loadSdk(): void {
    if (this.ssm !== undefined) {
      return;
    }

    try {
      const ssm = require('aws-sdk/clients/ssm');
      this.ssm = new ssm({
        apiVersion: '2014-11-06',
        region: this.region,
      });
    } catch (e) {
      throw new Error('You must install the aws-sdk in order to use the SSMLoader: npm i aws-sdk');
    }
    return;
  }

  async load(key: string): Promise<any> {
    this.loadSdk();

    let ssmParam;
    try {
      ssmParam = await this.ssm.getParameter({
        Name: key,
        // WithDecryption: true || false
      }).promise();
    } catch (e) {
      // TODO: CHANGE THE ERROR THROWN DEPENDING IF NOT SET, OR SOME OTHER ERROR
      this.logger.error(`Failed to load key (${key}) from SSM: ${e.message}`);
      throw new KeyLoadingError(key, this);
    }

    return ssmParam.Parameter.Value;
  }
}