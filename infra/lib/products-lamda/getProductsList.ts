import { mockProducts } from './products.mock';

export async function main() {
  const products = mockProducts;
  return products
    ? Object.keys(products).map((key) => {
        return {
          id: key,
          ...products[key],
        };
      })
    : { error: 'Products not found' };
}
