// Filename: Todo/handler.ts
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { Handler } from 'aws-lambda';

const dynamoDB = new DynamoDBClient({ region: 'us-east-1' });

// ⚡ Use environment variables for table names
const productsTable = process.env.PRODUCTS_TABLE || 'products';
const stockTable = process.env.STOCK_TABLE || 'stock';

export const main: Handler = async () => {
  try {
    // Get all products
    const productsData = await dynamoDB.send(
      new ScanCommand({ TableName: productsTable }),
    );

    // Get all stock
    const stockData = await dynamoDB.send(
      new ScanCommand({ TableName: stockTable }),
    );

    // Convert stock array into a lookup map
    const stockMap: Record<string, number> = {};
    stockData.Items?.forEach((item) => {
      stockMap[item.product_id.S as string] = parseInt(
        item.count.N as string,
        10,
      );
    });

    // Merge products with their stock counts
    const result =
      productsData.Items?.map((item) => ({
        id: item.id.S,
        title: item.title.S,
        description: item.description.S,
        price: Number(item.price.N),
        count: stockMap[item.id.S as string] ?? 0,
        image: item.image?.S ?? '',
      })) ?? [];

    return result;
  } catch (error) {
    console.error('Error fetching products:', error);
    return JSON.stringify({ error: 'Error fetching products' });
  }
};
