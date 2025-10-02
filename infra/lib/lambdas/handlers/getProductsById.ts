import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { GetProductByIdEvent } from '../../../../src/app/products/product.interface';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function main(event: GetProductByIdEvent) {
  try {
    const command = new GetItemCommand({
      TableName: process.env.PRODUCTS_TABLE || 'products',
      Key: {
        id: { S: event.productId.toString() },
      },
    });

    const response = await client.send(command);

    if (!response.Item) {
      return { error: 'Product not found' };
    }

    // Convert DynamoDB response (AttributeValues) into plain JS object
    const product = {
      id: response.Item.id.S,
      title: response.Item.title.S,
      description: response.Item.description?.S || '',
      price: parseInt(response.Item.price.N || '0', 10),
      image: response.Item.image?.S || '',
    };

    return product;
  } catch (err) {
    console.error('Error fetching product:', err);
    return { error: 'Failed to fetch product' };
  }
}
