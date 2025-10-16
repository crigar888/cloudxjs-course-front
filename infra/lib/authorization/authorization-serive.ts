import { Resource } from "aws-cdk-lib";
import { LambdaService } from "../lambdas/lambda.service";
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class AuthorizationService {

  scope: any;
  lambdaService: LambdaService;

  constructor(scope: any) {
    this.scope = scope;
    this.lambdaService = new LambdaService(scope);
  }
  

  createAuthorizer() {
    const basicAuthorizerLambda = this.lambdaService.createBasicLamda(
        'basic-authorizer-lambda',
        'basicAuthorizerLambda',
        'basicAuthorizer',
    );

    return new apigateway.TokenAuthorizer(this.scope, 'BasicAuthorizer', {
      handler: basicAuthorizerLambda,
    });
  }
}