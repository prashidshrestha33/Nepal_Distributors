import { Injectable } from '@angular/core';
import { BaseApiService, PaginatedResponse, PaginationParams } from './base-api.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
  isApproved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService extends BaseApiService {
  private endpoint = '/api/orders';

  constructor(http: HttpClient) {
    super(http);
  }

  getOrders(params?: PaginationParams): Observable<PaginatedResponse<Order>> {
    return this.getList<Order>(this.endpoint, params);
  }

  getOrder(id: number): Observable<Order> {
    return this.getById<Order>(this.endpoint, id);
  }

  createOrder(order: Partial<Order>): Observable<Order> {
    return this.create<Order>(this.endpoint, order);
  }

  updateOrder(id: number, order: Partial<Order>): Observable<Order> {
    return this.update<Order>(this.endpoint, id, order);
  }

  deleteOrder(id: number): Observable<any> {
    return this.delete(this.endpoint, id);
  }

  approveOrder(id: number): Observable<Order> {
    return this.approve<Order>(this.endpoint, id);
  }

  rejectOrder(id: number, reason?: string): Observable<Order> {
    return this.reject<Order>(this.endpoint, id, reason);
  }
}
