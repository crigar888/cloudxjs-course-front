import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ImportFileComponent } from '../import-file/import-file.component';
import { ApiGatewayService } from '../shared/services/apiGateway.service';
import { ProductItemComponent } from './product-item/product-item.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  standalone: true,
  imports: [ProductItemComponent, ImportFileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  constructor() {
    // effect runs whenever `products()` changes
    effect(() => {
      console.log('Products updated:', this.products());
    });
  }
  // products = toSignal(inject(ProductsService).getProducts(), {
  //   initialValue: [],
  // });

  private apiGatewayService = inject(ApiGatewayService);

  products = toSignal(this.apiGatewayService.getProducts(), {
    initialValue: [],
  });

  ngOnInit(): void {
    const githubLogin = 'crigar888';
    const password = 'TEST_PASSWORD';
    const token = btoa(`${githubLogin}:${password}`); // Base64 encode

    localStorage.setItem('authorization_token', token);
  }
}
