import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../products/product.interface';

@Injectable({
  providedIn: 'root',
})
export class ApiGatewayService {
  private readonly baseUrl =
    'https://d6zjylj1u2.execute-api.us-east-1.amazonaws.com/prod';

  constructor(private http: HttpClient) {}

  /**
   * Fetch all products from API Gateway
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }
}
