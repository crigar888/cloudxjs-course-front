// Filename: hello-lambda-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { LambdaService } from '../lambdas/lambda.service';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ApiGatewayService } from '../gateway/apiGateway.service';
import * as s3n from "aws-cdk-lib/aws-s3-notifications";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaService = new LambdaService(this);
    const apiGatewayService = new ApiGatewayService(this);

    const bucket = new s3.Bucket(this, 'ImportServiceBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
    {
      allowedOrigins: ['*'],
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.PUT,
        s3.HttpMethods.POST,
      ],
      allowedHeaders: ['*'],
      exposedHeaders: ['ETag'],
    },
  ],
    });

    new s3deploy.BucketDeployment(this, 'DeployUploadedFolder', {
      sources: [s3deploy.Source.data('uploaded/.keep', 'placeholder')],
      destinationBucket: bucket,
    });

    new cdk.CfnOutput(this, 'BucketNameOutput', {
      value: bucket.bucketName,
    });

    const importProductsFileLambda = lambdaService.createBasicLamda(
      'import-product-file-lambda',
      'importProductsFileLambda',
      'importProductsFile',
    );

    const api = apigateway.RestApi.fromRestApiAttributes(this, 'ImportedApi', {
      restApiId: 'd6zjylj1u2', 
      rootResourceId: 'izx4ke4wua', 
    });
    const importLambdaIntegration = apiGatewayService.createLamdaIntegration(
      importProductsFileLambda,
      'import',
    );
    const importResource = api.root.addResource('import');
    importResource.addMethod('GET', importLambdaIntegration, {
      methodResponses: apiGatewayService.METHOD_RESPONSES,
    });

    apiGatewayService.addCoresPreflight(importResource, ['GET', 'POST', 'PUT']);

    bucket.grantReadWrite(importProductsFileLambda);
    importProductsFileLambda.addEnvironment('BUCKET_NAME', bucket.bucketName);

    const importFileParserLambda = lambdaService.createBasicLamda(
      'import-file-parser-lambda',
      'importFileParserLambda',
      'importFileParser',
    );
    bucket.grantReadWrite(importFileParserLambda);
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: "uploaded/" }
    );
  }
}
