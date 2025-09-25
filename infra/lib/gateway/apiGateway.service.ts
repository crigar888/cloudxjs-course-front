import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class ApiGatewayService {
  private scope: Construct;
  public readonly URLS = {
    app: 'https://d1v9y7gbynp093.cloudfront.net',
    products: 'products',
    stock: 'stock',
  };

  public readonly METHOD_RESPONSES = [
    {
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
      },
    },
  ];

  public readonly RESPONSE_PARAMETERS = {
    'method.response.header.Access-Control-Allow-Origin': `'${this.URLS.app}'`,
    'method.response.header.Access-Control-Allow-Headers':
      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'method.response.header.Access-Control-Allow-Methods': "'GET,OPTIONS'",
  };

  public readonly REQUEST_TEMPLATES = {
    products: { 'application/json': '{ "statusCode": 200 }' },
    productsNew: { 'application/json': '$input.body' },
    productId: {
      'application/json': `{ "productId": "$input.params('productId')" }`,
    },
  };

  constructor(scope: Construct) {
    this.scope = scope;
  }

  public createApiGateway() {
    return new apigateway.RestApi(this.scope, 'my-api', {
      restApiName: 'My API Gateway',
      description: 'This API serves the Lambda functions.',
    });
  }

  public createLamdaIntegration(lamda: NodejsFunction, resource: string) {
    return new apigateway.LambdaIntegration(lamda, {
      proxy: false,
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: this.RESPONSE_PARAMETERS,
        },
      ],
      requestTemplates:
        this.REQUEST_TEMPLATES[resource as keyof typeof this.REQUEST_TEMPLATES],
    });
  }

  public addCoresPreflight(
    resource: apigateway.IResource,
    allowMethods: string[],
  ) {
    resource.addCorsPreflight({
      allowOrigins: [this.URLS.app],
      allowMethods: allowMethods,
    });
  }
}
