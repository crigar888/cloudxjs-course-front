// Filename: Todo/handler.ts
import { Handler } from 'aws-lambda';
import dotenv from 'dotenv';

dotenv.config();

export const main: Handler = async (event: any) => {
  try {
    const authHeader = event.authorizationToken;

    if (!authHeader) {
      return generatePolicy('unauthorized', 'Deny', event.methodArn, 401);
    }

    const encodedCredentials = authHeader.split(' ')[1];
    const decoded = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    const expectedPassword = process.env[username];
    if (!expectedPassword || expectedPassword !== password) {
      return generatePolicy(username || 'unknown', 'Deny', event.methodArn, 403);
    }

    return generatePolicy(username, 'Allow', event.methodArn, 200);
  } catch (err) {
    console.error('Error in authorizer:', err);
    return generatePolicy('error', 'Deny', event.methodArn, 500);
  }
};

function generatePolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  statusCode: number
) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: {
      statusCode,
    },
  };
}
