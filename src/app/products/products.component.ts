import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { ProductItemComponent } from './product-item/product-item.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiGatewayService } from '../shared/services/apiGateway.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  standalone: true,
  imports: [ProductItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent {
  constructor() {
    // effect runs whenever `products()` changes
    effect(() => {
      console.log('Products updated:', this.products());
    });
  }
  // products = toSignal(inject(ProductsService).getProducts(), {
  //   initialValue: [],
  // });

  products = toSignal(inject(ApiGatewayService).getProducts(), {
    initialValue: [],
  });
}
