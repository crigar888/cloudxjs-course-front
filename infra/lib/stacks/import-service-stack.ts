// Filename: hello-lambda-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { LambdaService } from '../lambdas/lambda.service';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ApiGatewayService } from '../gateway/apiGateway.service';
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from "aws-cdk-lib/aws-sqs";
import { AuthorizationService } from '../authorization/authorization-serive';


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

    // autorization 

    const authorizationService = new AuthorizationService(this);
    const basicAuthorizer = authorizationService.createAuthorizer();

    importResource.addMethod('OPTIONS', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,OPTIONS'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
        responseTemplates: {
          'application/json': '',
        },
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    importResource.addMethod('GET', importLambdaIntegration, {
      authorizer: basicAuthorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
      },
    ],
    });


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

    const productsTable = dynamodb.Table.fromTableName(
      this,
      'ProductsTable',
      'products'
    );

    const stockTable = dynamodb.Table.fromTableName(
      this,
      'StockTable',
      'stock'
    );

    // 👇 Dar permisos a la Lambda
    productsTable.grantReadWriteData(importFileParserLambda);
    stockTable.grantReadWriteData(importFileParserLambda);

    const productQueue = sqs.Queue.fromQueueArn(
      this,
      "ImportedProductQueue",
      cdk.Fn.importValue("ProductQueueArn") 
    );

    productQueue.grantSendMessages(importFileParserLambda);

    importFileParserLambda.addEnvironment('SQS_URL', productQueue.queueUrl);

    


  }
}
