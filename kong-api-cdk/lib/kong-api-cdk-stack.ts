import * as cdk from '@aws-cdk/core';
import * as cfn_inc from '@aws-cdk/cloudformation-include';
import { KeyPair } from 'cdk-ec2-key-pair';
import * as path from 'path';

export class KongApiCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // Create EC2 keypair for Kong instances and store public/private key in Secrets Manager
    const key = new KeyPair(this, 'KongEc2KeyPair', {
      name:`${id}KeyPair`,
      description: 'Key pair for Kong EC2 instances',
      storePublicKey: true,
    });
    
    // Import Kong CloudFormation template with Postgres
    const kongCfn = new cfn_inc.CfnInclude(this, 'KongPostgresTemplate', {
      templateFile: path.join(__dirname, 'kong-postgres.template.yml'),
      preserveLogicalIds: true,
      parameters: {
        'KongVersion': '', // Left blank so it installs latest version
        'KongKeyName': key.keyPairName,
        'KongFleetDesiredSize': '2',
        'KongInstanceType': 't3.medium',
        'KongConfigs': 'log_level = debug^admin_listen = 0.0.0.0:8001, 0.0.0.0:8444 ssl^admin_gui_listen = 0.0.0.0:8002, 0.0.0.0:8445 ssl',
        'DBClass': 'db.t3.medium',
        'DBHost': '', // Left blank so it creates a new DB instance
      },
    });
    kongCfn.node.addDependency(key);
  }
}
