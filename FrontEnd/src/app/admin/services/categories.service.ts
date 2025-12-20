import { Injectable } from '@angular/core';
import { BaseApiService, PaginatedResponse, PaginationParams } from './base-api.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Category {
  id: number;
  name: string;
  description: string;
  isApproved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService extends BaseApiService {
  private endpoint = '/api/categories';

  constructor(http: HttpClient) {
    super(http);
  }

  getCategories(params?: PaginationParams): Observable<PaginatedResponse<Category>> {
    return this.getList<Category>(this.endpoint, params);
  }

  getCategory(id: number): Observable<Category> {
    return this.getById<Category>(this.endpoint, id);
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.create<Category>(this.endpoint, category);
  }

  updateCategory(id: number, category: Partial<Category>): Observable<Category> {
    return this.update<Category>(this.endpoint, id, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.delete(this.endpoint, id);
  }

  approveCategory(id: number): Observable<Category> {
    return this.approve<Category>(this.endpoint, id);
  }

  rejectCategory(id: number, reason?: string): Observable<Category> {
    return this.reject<Category>(this.endpoint, id, reason);
  }
}
