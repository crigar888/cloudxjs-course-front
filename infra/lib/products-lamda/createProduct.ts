// Filename: createProduct.ts
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../../../src/app/products/product.interface';

const dynamoDB = new DynamoDBClient({ region: 'us-east-1' });
const productsTable = process.env.PRODUCTS_TABLE || 'products';

export const main = async (event: Product) => {
  try {
    if (!event) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const id = uuidv4();

    await dynamoDB.send(
      new PutItemCommand({
        TableName: productsTable,
        Item: {
          id: { S: id },
          title: { S: event?.title },
          description: { S: event?.description },
          price: { N: event?.price.toString() },
          image: { S: event?.image },
        },
      }),
    );

    return {
      message: 'Product created successfully',
      product: event,
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
