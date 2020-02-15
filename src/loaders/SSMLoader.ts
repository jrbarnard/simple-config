import { ILoader } from '../types';

export class SSMLoader implements ILoader {
  private ssm: any;

  private loadSdk(): void {
    if (this.ssm !== undefined) {
      return;
    }

    try {
      const ssm = require('aws-sdk/clients/ssm');
      this.ssm = new ssm({
        apiVersion: '2014-11-06'
      });
    } catch (e) {
      throw new Error('You must install the aws-sdk in order to use the SSMLoader: npm i --save aws-sdk');
    }
    return;
  }
  
  async load(key: string): Promise<any> {
    this.loadSdk();

    const ssmParam = await this.ssm.getParameter({
      Name: key,
      // WithDecryption: true || false
    }).promise();

    return ssmParam.Parameter.Value;
  }
}