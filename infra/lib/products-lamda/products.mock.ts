import { Product } from '../../../src/app/products/product.interface';

export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Wireless Headphones',
    description: 'Noise-cancelling over-ear headphones with long battery life.',
    price: 120.99,
    count: 15,
    image: 'https://picsum.photos/300/200?random=1',
  },
  {
    id: '2',
    title: 'Smartphone',
    description:
      'Latest-gen smartphone with powerful performance and sleek design.',
    price: 699.5,
    count: 30,
    image: 'https://picsum.photos/300/200?random=2',
  },
  {
    id: '3',
    title: 'Gaming Mouse',
    description:
      'Ergonomic gaming mouse with customizable RGB and high DPI sensor.',
    price: 59.99,
    count: 50,
    image: 'https://picsum.photos/300/200?random=3',
  },
  {
    id: '4',
    title: 'Mechanical Keyboard',
    description:
      'RGB mechanical keyboard with tactile switches and metal frame.',
    price: 150.0,
    count: 20,
    image: 'https://picsum.photos/300/200?random=4',
  },
  {
    id: '5',
    title: '4K Monitor',
    description:
      'Ultra HD 4K monitor with vivid colors and fast response time.',
    price: 399.99,
    count: 10,
    image: 'https://picsum.photos/300/200?random=5',
  },
];
