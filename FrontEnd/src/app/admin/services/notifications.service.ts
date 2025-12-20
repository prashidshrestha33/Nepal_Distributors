import { Injectable } from '@angular/core';
import { BaseApiService, PaginatedResponse, PaginationParams } from './base-api.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Notification {
  id: number;
  type: 'order' | 'quotation';
  referenceId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService extends BaseApiService {
  private endpoint = '/api/notifications';

  constructor(http: HttpClient) {
    super(http);
  }

  getNotifications(params?: PaginationParams): Observable<PaginatedResponse<Notification>> {
    return this.getList<Notification>(this.endpoint, params);
  }

  getNotification(id: number): Observable<Notification> {
    return this.getById<Notification>(this.endpoint, id);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}${this.endpoint}/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}${this.endpoint}/read-all`, {});
  }

  deleteNotification(id: number): Observable<any> {
    return this.delete(this.endpoint, id);
  }
}
