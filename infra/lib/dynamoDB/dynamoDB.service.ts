// Filename: dynamoDB.service.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DynamoDBService {
  private scope: Construct;
  public static readonly TABLES_NAMES = {
    products: 'products',
    stock: 'stock',
  };

  constructor(scope: Construct) {
    this.scope = scope;
  }

  public createTables() {
    const productsTable = new dynamodb.Table(this.scope, 'ProductsTable', {
      tableName: DynamoDBService.TABLES_NAMES.products,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stockTable = new dynamodb.Table(this.scope, 'StockTable', {
      tableName: DynamoDBService.TABLES_NAMES.stock,
      partitionKey: {
        name: 'product_id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    return { productsTable, stockTable };
  }
}
