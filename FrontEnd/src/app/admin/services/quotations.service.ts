import { Injectable } from '@angular/core';
import { BaseApiService, PaginatedResponse, PaginationParams } from './base-api.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Quotation {
  id: number;
  quotationNumber: string;
  userId: number;
  totalAmount: number;
  items: QuotationItem[];
  status: 'pending' | 'approved' | 'rejected';
  isApproved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuotationsService extends BaseApiService {
  private endpoint = '/api/quotations';

  constructor(http: HttpClient) {
    super(http);
  }

  getQuotations(params?: PaginationParams): Observable<PaginatedResponse<Quotation>> {
    return this.getList<Quotation>(this.endpoint, params);
  }

  getQuotation(id: number): Observable<Quotation> {
    return this.getById<Quotation>(this.endpoint, id);
  }

  createQuotation(quotation: Partial<Quotation>): Observable<Quotation> {
    return this.create<Quotation>(this.endpoint, quotation);
  }

  updateQuotation(id: number, quotation: Partial<Quotation>): Observable<Quotation> {
    return this.update<Quotation>(this.endpoint, id, quotation);
  }

  deleteQuotation(id: number): Observable<any> {
    return this.delete(this.endpoint, id);
  }

  approveQuotation(id: number): Observable<Quotation> {
    return this.approve<Quotation>(this.endpoint, id);
  }

  rejectQuotation(id: number, reason?: string): Observable<Quotation> {
    return this.reject<Quotation>(this.endpoint, id, reason);
  }
}
