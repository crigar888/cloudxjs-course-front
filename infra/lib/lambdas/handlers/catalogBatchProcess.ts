// Filename: createProduct.ts
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { Product } from '../../../../src/app/products/product.interface';
import { DynamoDBService } from '../../dynamoDB/dynamoDB.service';
import { SQSEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoDB = new DynamoDBClient({ region: 'us-east-1' });
const productsTable = DynamoDBService.TABLES_NAMES.products;
const stockTable = DynamoDBService.TABLES_NAMES.stock;

const snsClient = new SNSClient({ region: 'us-east-1' });

export const main = async (event: SQSEvent) => {
  console.log('Received SQS event with', event.Records.length, 'messages');
  console.log('Received SQS event with', event.Records);

  // Process all messages in parallel
  const results = await Promise.allSettled(
    event.Records.map(async (record) => {
      try {
        const productData: Product = JSON.parse(record.body);

        console.log('Creating product:', productData);

        const id = uuidv4();
        // Save product in the products table
        await dynamoDB.send(
          new PutItemCommand({
            TableName: productsTable,
            Item: {
              id: { S: id },
              title: { S: productData.title },
              description: { S: productData.description },
              price: { N: productData.price.toString() },
              image: { S: productData.image },
            },
          })
        );

        // Save stock entry in the stock table
        await dynamoDB.send(
          new PutItemCommand({
            TableName: stockTable,
            Item: {
              product_id: { S: id },
              count: { N: (productData.count ?? 0).toString() },
            },
          })
        );

        console.log(`✅ Product ${productData.title} created successfully.`);

        const snsTopicArn = process.env.SNS_TOPIC_ARN;
        if (!snsTopicArn) {
          throw new Error('SNS_TOPIC_ARN is not defined in environment variables');
        }

        const message = {
          message: `Product ${productData.title} created successfully`,
          product: {
            id,
            title: productData.title,
            description: productData.description,
            price: productData.price,
            count: productData.count ?? 0,
          },
        };

        await snsClient.send(
          new PublishCommand({
            TopicArn: snsTopicArn,
            Subject: 'New Product Created',
            Message: JSON.stringify(message, null, 2),
          })
        );

        console.log(`📨 Notification sent for product ${productData.title}`);

      } catch (err) {
        console.error('❌ Error processing record:', record, err);
        throw err;
      }
    })
  );

  //log failed ones
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.error(`⚠️ ${failed.length} records failed to process.`);
    throw new Error('Some records failed to process');
  }

  console.log('All messages processed successfully.');
};
