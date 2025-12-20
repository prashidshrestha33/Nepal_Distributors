import { Injectable } from '@angular/core';
import { BaseApiService, PaginatedResponse, PaginationParams } from './base-api.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Product {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  price: number;
  quantity: number;
  image?: string;
  isApproved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService extends BaseApiService {
  private endpoint = '/api/products';

  constructor(http: HttpClient) {
    super(http);
  }

  getProducts(params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    return this.getList<Product>(this.endpoint, params);
  }

  getProduct(id: number): Observable<Product> {
    return this.getById<Product>(this.endpoint, id);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.create<Product>(this.endpoint, product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.update<Product>(this.endpoint, id, product);
  }

  deleteProduct(id: number): Observable<any> {
    return this.delete(this.endpoint, id);
  }

  approveProduct(id: number): Observable<Product> {
    return this.approve<Product>(this.endpoint, id);
  }

  rejectProduct(id: number, reason?: string): Observable<Product> {
    return this.reject<Product>(this.endpoint, id, reason);
  }
}
