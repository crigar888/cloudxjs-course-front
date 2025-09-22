import { TestBed } from '@angular/core/testing';

import { ApiGatewayService } from './apiGateway.service';

describe('ApiGatewayService', () => {
  let service: ApiGatewayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiGatewayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
