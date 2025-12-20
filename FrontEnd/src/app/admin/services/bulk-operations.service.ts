import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BulkOperationsService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Bulk approve multiple items
   */
  bulkApprove<T>(endpoint: string, ids: any[]): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}/bulk-approve`, { ids });
  }

  /**
   * Bulk reject multiple items
   */
  bulkReject<T>(endpoint: string, ids: any[], reason?: string): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}/bulk-reject`, { ids, reason });
  }

  /**
   * Bulk delete multiple items
   */
  bulkDelete<T>(endpoint: string, ids: any[]): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}/bulk-delete`, { ids });
  }

  /**
   * Bulk toggle status
   */
  bulkToggleStatus<T>(endpoint: string, ids: any[], status: boolean): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}/bulk-toggle-status`, { ids, status });
  }
}
