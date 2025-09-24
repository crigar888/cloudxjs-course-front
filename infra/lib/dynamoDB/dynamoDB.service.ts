// Filename: dynamoDB.service.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DynamoDBService {
  public readonly TABLES_NAMES = {
    products: 'products',
    stock: 'stock',
  };

  constructor() {}

  public createTables(scope: Construct) {
    const productsTable = new dynamodb.Table(scope, 'ProductsTable', {
      tableName: this.TABLES_NAMES.products,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stockTable = new dynamodb.Table(scope, 'StockTable', {
      tableName: this.TABLES_NAMES.stock,
      partitionKey: {
        name: 'product_id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    return { productsTable, stockTable };
  }

  public getTablesNames() {
    return this.TABLES_NAMES;
  }
}
