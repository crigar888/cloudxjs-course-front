// Filename: hello-lambda-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ProductsLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListLambda = new NodejsFunction(
      this,
      'get-products-list-lambda',
      {
        functionName: 'getProductsListLambda',
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        entry: path.join(__dirname, 'getProductsList.ts'),
        handler: 'main',
      },
    );

    const getProductsByIdLambda = new NodejsFunction(
      this,
      'get-products-by-id-lambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        entry: path.join(__dirname, 'getProductsById.ts'),
        handler: 'main',
      },
    );

    const api = new apigateway.RestApi(this, 'my-api', {
      restApiName: 'My API Gateway',
      description: 'This API serves the Lambda functions.',
    });

    // /products
    const productsFromLambdaIntegration = new apigateway.LambdaIntegration(
      getProductsListLambda,
      {
        proxy: false,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin':
                "'https://d1uhuxvqjmqigt.cloudfront.net'",
              'method.response.header.Access-Control-Allow-Headers':
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              'method.response.header.Access-Control-Allow-Methods':
                "'GET,OPTIONS'",
            },
          },
        ],
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }',
        },
      },
    );

    const productsResource = api.root.addResource('products');

    productsResource.addMethod('GET', productsFromLambdaIntegration, {
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

    productsResource.addCorsPreflight({
      allowOrigins: ['https://d1uhuxvqjmqigt.cloudfront.net'],
      allowMethods: ['GET'],
    });

    // /products/{productId}
    productsResource.addResource('{productId}').addMethod(
      'GET',
      new apigateway.LambdaIntegration(getProductsByIdLambda, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin':
                "'https://d1uhuxvqjmqigt.cloudfront.net'",
            },
          },
        ],
        requestTemplates: {
          'application/json': `{ "productId": "$input.params('productId')" }`,
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      },
    );

    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: 'products',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stockTable = new dynamodb.Table(this, 'StockTable', {
      tableName: 'stock',
      partitionKey: {
        name: 'product_id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const addProductsLambda = new NodejsFunction(this, 'AddProductsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      entry: path.join(__dirname, '../dynamoDB/handler.ts'),
      handler: 'addProducts',
      environment: {
        TABLE_NAME: productsTable.tableName,
        STOCK_TABLE: stockTable.tableName,
      },
    });

    const lambdas = [
      addProductsLambda,
      getProductsListLambda,
      getProductsByIdLambda,
    ];

    lambdas.forEach((fn) => {
      productsTable.grantReadWriteData(fn);
      stockTable.grantReadWriteData(fn);
    });
  }
}
