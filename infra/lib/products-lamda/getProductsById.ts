import { mockProducts } from './products.mock';
import { GetProductByIdEvent } from '../../../src/app/products/product.interface';

export async function main(event: GetProductByIdEvent) {
  const product = mockProducts.find((p) => p.id === event.productId.toString());
  return product ? product : { error: 'Product not found' };
}
