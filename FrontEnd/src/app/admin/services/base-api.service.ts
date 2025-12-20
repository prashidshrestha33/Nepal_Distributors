import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected apiUrl = environment.apiBaseUrl;

  constructor(protected http: HttpClient) {}

  /**
   * Build HTTP params from pagination parameters
   */
  public buildParams(params?: PaginationParams): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }
    
    return httpParams;
  }

  /**
   * Generic GET list method
   */
  public getList<T>(endpoint: string, params?: PaginationParams): Observable<PaginatedResponse<T>> {
    return this.http.get<PaginatedResponse<T>>(
      `${this.apiUrl}${endpoint}`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * Generic GET by ID method
   */
  public getById<T>(endpoint: string, id: number | string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}/${id}`);
  }

  /**
   * Generic POST method
   */
  public create<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data);
  }

  /**
   * Generic PUT method
   */
  public update<T>(endpoint: string, id: number | string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}/${id}`, data);
  }

  /**
   * Generic DELETE method
   */
  public delete<T>(endpoint: string, id: number | string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}/${id}`);
  }

  /**
   * Generic approval method
   */
  public approve<T>(endpoint: string, id: number | string): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}/${id}/approve`, {});
  }

  /**
   * Generic rejection method
   */
  public reject<T>(endpoint: string, id: number | string, reason?: string): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}/${id}/reject`, { reason });
  }
}
