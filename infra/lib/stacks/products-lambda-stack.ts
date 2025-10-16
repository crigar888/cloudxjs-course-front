// Filename: hello-lambda-stack.ts
import * as cdk from 'aws-cdk-lib';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from 'constructs';
import { DynamoDBService } from '../dynamoDB/dynamoDB.service';
import { ApiGatewayService } from '../gateway/apiGateway.service';
import { LambdaService } from '../lambdas/lambda.service';

export class ProductsLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaService = new LambdaService(this);
    const apiGatewayService = new ApiGatewayService(this);
    const dynamoService = new DynamoDBService(this);

    const getProductsListLambda = lambdaService.createBasicLamda(
      'get-products-list-lambda',
      'getProductsListLambda',
      'getProductsList',
    );

    const getProductsByIdLambda = lambdaService.createBasicLamda(
      'get-products-by-id-lambda',
      'getProductsByIdLambda',
      'getProductsById',
    );

    const api = apiGatewayService.createApiGateway();

    // /products
    const productsFromLambdaIntegration =
      apiGatewayService.createLamdaIntegration(
        getProductsListLambda,
        'products',
      );

    const productsResource = api.root.addResource(
      apiGatewayService.URLS.products,
    );

    productsResource.addMethod('GET', productsFromLambdaIntegration, {
      methodResponses: apiGatewayService.METHOD_RESPONSES,
    });

    apiGatewayService.addCoresPreflight(productsResource, ['GET', 'POST']);

    // /products/{productId}

    const productByIdFromLambdaIntegration =
      apiGatewayService.createLamdaIntegration(
        getProductsByIdLambda,
        'productId',
      );
    productsResource
      .addResource('{productId}')
      .addMethod('GET', productByIdFromLambdaIntegration, {
        methodResponses: apiGatewayService.METHOD_RESPONSES,
      });

    const { productsTable, stockTable } = dynamoService.createTables();

    const addProductsLambda = lambdaService.createBasicLamda(
      'add-products-lambda',
      'addProductsLambda',
      'postProducts',
    );

    const createProductLambda = lambdaService.createBasicLamda(
      'create-product-lambda',
      'createProductLambda',
      'postProduct',
    );

    productsResource.addMethod(
      'POST',
      apiGatewayService.createLamdaIntegration(
        createProductLambda,
        'productsNew',
      ),
      {
        methodResponses: apiGatewayService.METHOD_RESPONSES,
      },
    );

    //SQS

    const catalogBatchProcessLambda = lambdaService.createBasicLamda(
      'catalog-batch-process-lambda',
      'catalogBatchProcessLambda',
      'catalogBatchProcess',
    );

    const productSqs = new sqs.Queue(this, "product-sqs-v1", {
      visibilityTimeout: cdk.Duration.seconds(30), // should be > lambda timeout
    });

    new cdk.CfnOutput(this, "ProductQueueArn", {
      value: productSqs.queueArn,
      exportName: "ProductQueueArn",
    });

    catalogBatchProcessLambda.addEventSource(
      new SqsEventSource(productSqs, {
        batchSize: 5,
      })
    );

    const lambdas = [
      addProductsLambda,
      getProductsListLambda,
      getProductsByIdLambda,
      createProductLambda,
      catalogBatchProcessLambda
    ];

    lambdas.forEach((fn) => {
      productsTable.grantReadWriteData(fn);
      stockTable.grantReadWriteData(fn);
    });

    //SNS

    const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
      displayName: 'Product creation notifications',
      topicName: 'createProductTopic',
    });

    createProductTopic.addSubscription(
      new subs.EmailSubscription('crigar888@gmail.com')
    );

    createProductTopic.grantPublish(catalogBatchProcessLambda);

    catalogBatchProcessLambda.addEnvironment('SNS_TOPIC_ARN', createProductTopic.topicArn);

  }
}
