// Filename: createProduct.ts
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../../../../src/app/products/product.interface';
import { DynamoDBService } from '../../dynamoDB/dynamoDB.service';

const dynamoDB = new DynamoDBClient({ region: 'us-east-1' });
const productsTable = DynamoDBService.TABLES_NAMES.products;
const stockTable = DynamoDBService.TABLES_NAMES.stock;

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

    await dynamoDB.send(
      new PutItemCommand({
        TableName: stockTable,
        Item: {
          product_id: { S: id },
          count: { N: (event?.count ?? 0).toString() },
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
