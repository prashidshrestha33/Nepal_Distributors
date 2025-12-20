import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'
  module: string; // 'users', 'products', 'categories', etc.
  entityId: string;
  entityName: string;
  changes?: Record<string, any>; // Before/after changes
  reason?: string; // For rejections
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get audit logs with pagination and filters
   */
  getLogs(params?: {
    page?: number;
    pageSize?: number;
    module?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<AuditLogResponse> {
    let queryParams = '';
    if (params) {
      const paramArray = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);
      queryParams = paramArray.length > 0 ? '?' + paramArray.join('&') : '';
    }
    return this.http.get<AuditLogResponse>(`${this.apiUrl}/api/audit-logs${queryParams}`);
  }

  /**
   * Get logs for specific entity
   */
  getEntityLogs(module: string, entityId: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(
      `${this.apiUrl}/api/audit-logs/entity/${module}/${entityId}`
    );
  }

  /**
   * Get user activity summary
   */
  getUserActivity(userId: string, days: number = 30): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/api/audit-logs/user/${userId}/activity?days=${days}`
    );
  }

  /**
   * Export audit logs
   */
  exportLogs(params?: any): Observable<any> {
    let queryParams = '';
    if (params) {
      const paramArray = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);
      queryParams = paramArray.length > 0 ? '?' + paramArray.join('&') : '';
    }
    return this.http.get(`${this.apiUrl}/api/audit-logs/export${queryParams}`, {
      responseType: 'blob'
    });
  }
}
