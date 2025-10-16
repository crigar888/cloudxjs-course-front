import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, throwError } from 'rxjs';
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

  uploadCsv(file: File, fileName: string): Observable<any> {
    if (!file) {
      console.error('No file provided for upload.');
      return throwError(() => new Error('No file provided'));
    }

    const authorization_token = localStorage.getItem('authorization_token');
    if (!authorization_token) {
      console.error('Authorization token not found in localStorage');
      return throwError(() => new Error('Missing authorization token'));
    }

    const headers = {
      Authorization: `Basic ${authorization_token}`,
    };

    return this.http.get<{ url: string }>(
      `${this.baseUrl}/import?name=${fileName}`,
    ).pipe(
      switchMap((response: any) => {
        const signedUrl = response.uploadUrl;
        console.log('Obtained signed URL:', signedUrl);

        return this.http.put(signedUrl, file, {
          headers: { 'Content-Type': file.type },
          responseType: 'text'
        });
      })
    );
  }
}
