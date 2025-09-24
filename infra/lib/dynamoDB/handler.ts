// Filename: Todo/handler.ts
import { Handler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoDB = new DynamoDBClient({ region: 'us-east-1' });

// ⚡ Use environment variables for table names
const productsTable = process.env.PRODUCTS_TABLE || 'products';
const stockTable = process.env.STOCK_TABLE || 'stock';

export const addProducts: Handler = async () => {
  try {
    const products = [
      {
        title: 'Laptop',
        description: 'Lightweight laptop for work and travel',
        price: 300,
        count: 5,
        image: 'https://picsum.photos/300/200?random=1',
      },
      {
        title: 'Headphones',
        description: 'Noise-cancelling wireless headphones',
        price: 250,
        count: 15,
        image: 'https://picsum.photos/300/200?random=2',
      },
      {
        title: 'Smartphone',
        description: 'Latest model smartphone with OLED screen',
        price: 999,
        count: 8,
        image: 'https://picsum.photos/300/200?random=3',
      },
    ];

    for (const p of products) {
      const productId = uuidv4();

      // Insert product with image
      const putProduct = new PutItemCommand({
        TableName: productsTable,
        Item: {
          id: { S: productId },
          title: { S: p.title },
          description: { S: p.description },
          price: { N: p.price.toString() },
          image: { S: p.image },
        },
      });
      await dynamoDB.send(putProduct);

      // Insert stock
      const putStock = new PutItemCommand({
        TableName: stockTable,
        Item: {
          product_id: { S: productId },
          count: { N: p.count.toString() },
        },
      });
      await dynamoDB.send(putStock);
    }

    return {
      statusCode: 200,
      body: '3 products with images and stock inserted successfully',
    };
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error adding products/stock to DynamoDB tables');
  }
};
