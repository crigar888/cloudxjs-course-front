import { mockProducts } from './products.mock';
import { GetProductByIdEvent } from '../../../src/app/products/product.interface';

export async function main(event: GetProductByIdEvent) {
  const product = mockProducts[event.productId];
  return product ? product : { error: 'Product not found' };
}
