import { Injectable } from '@angular/core';
import { BaseApiService, PaginatedResponse, PaginationParams } from './base-api.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface StaticValue {
  id: number;
  catalogName: string;
  displayName: string;
  value: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StaticValuesService extends BaseApiService {
  private endpoint = '/api/static-values';

  constructor(http: HttpClient) {
    super(http);
  }

  getStaticValues(params?: PaginationParams): Observable<PaginatedResponse<StaticValue>> {
    return this.getList<StaticValue>(this.endpoint, params);
  }

  getStaticValue(id: number): Observable<StaticValue> {
    return this.getById<StaticValue>(this.endpoint, id);
  }

  createStaticValue(value: Partial<StaticValue>): Observable<StaticValue> {
    return this.create<StaticValue>(this.endpoint, value);
  }

  updateStaticValue(id: number, value: Partial<StaticValue>): Observable<StaticValue> {
    return this.update<StaticValue>(this.endpoint, id, value);
  }

  deleteStaticValue(id: number): Observable<any> {
    return this.delete(this.endpoint, id);
  }

  toggleActive(id: number): Observable<StaticValue> {
    return this.http.patch<StaticValue>(`${this.apiUrl}${this.endpoint}/${id}/toggle`, {});
  }
}
