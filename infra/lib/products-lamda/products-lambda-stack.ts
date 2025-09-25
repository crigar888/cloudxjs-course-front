// Filename: hello-lambda-stack.ts
import * as cdk from 'aws-cdk-lib';
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

    const lambdas = [
      addProductsLambda,
      getProductsListLambda,
      getProductsByIdLambda,
      createProductLambda,
    ];

    lambdas.forEach((fn) => {
      productsTable.grantReadWriteData(fn);
      stockTable.grantReadWriteData(fn);
    });
  }
}
