// Filename: lambda.service.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import { DynamoDBService } from '../dynamoDB/dynamoDB.service';

export class LambdaService {
  private dynamoService = new DynamoDBService();

  constructor() {}

  public createBasicLamda(
    scope: Construct,
    id: string,
    name: string,
    handlerName: string,
  ): NodejsFunction {
    const createProductLambda = new NodejsFunction(scope, id, {
      functionName: name,
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      entry: path.join(__dirname, `./handlers/${handlerName}.ts`),
      handler: 'main',
      environment: {
        TABLE_NAME: this.dynamoService.getTablesNames().products,
        STOCK_TABLE: this.dynamoService.getTablesNames().stock,
      },
    });

    return createProductLambda;
  }
}
