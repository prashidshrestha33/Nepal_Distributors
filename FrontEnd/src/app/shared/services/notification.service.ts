import { Injectable, inject } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ApiGatewayService } from './api-gateway.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ReceivedNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  orderId?: string;
  orderNumber?: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private messaging = inject(Messaging);
  private http = inject(HttpClient);
  
  private notificationsSubject = new BehaviorSubject<ReceivedNotification[]>(this.getStoredNotifications());
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private apiGateway: ApiGatewayService) {}

  async requestPermission(): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        await navigator.serviceWorker.ready;
console.log(this.messaging);
        // Get FCM token with VAPID key
        const token = await getToken(this.messaging, {
          vapidKey: environment.vapidKey,
          serviceWorkerRegistration: registration
        });

        if (token) {
          await this.saveFcmTokenToBackend(token);
          return token;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error: any) {
      console.error("Permission request failed", error);
      return null;
    }
  }

  listenForMessages() {
    try {
      onMessage(this.messaging, (payload) => {
        if (payload.notification) {
          this.handleIncomingNotification(payload);
        }
      });
    } catch (error) {
      console.error("Error setting up message listener", error);
    }
  }

  private handleIncomingNotification(payload: any) {
    const title = payload.notification?.title || 'New Notification';
    const body = payload.notification?.body || '';
    const data = payload.data || {};

    const newNotification: ReceivedNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      type: data.type || 'system',
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      read: false,
      createdAt: new Date().toISOString()
    };

    const existing = this.getStoredNotifications();
    existing.unshift(newNotification);
    localStorage.setItem('local_notifications', JSON.stringify(existing));
    this.notificationsSubject.next(existing);

    // Show standard browser notification if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body
      });
    }
  }

  saveFcmTokenToBackend(token: string): Promise<any> {
    try {
      const apiUrl = `${environment.apiBaseUrl}/api/Users/setFCM?fciid=${token}`;

      return new Promise((resolve, reject) => {
        this.apiGateway.post(
          apiUrl,
          {},
          { requiresAuth: true }
        ).subscribe({
          next: (res) => {
            // Successfully set on backend; cache it locally
            localStorage.setItem('fcmToken_set', token);
            resolve(res);
          },
          error: (err) => {
            console.error("FCM save to backend failed", err);
            reject(err);
          }
        });
      });
    } catch (error) {
      console.error("FCM save failed", error);
      return Promise.resolve(null);
    }
  }

  getStoredNotifications(): ReceivedNotification[] {
    try {
      const stored = localStorage.getItem('local_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error reading stored notifications", e);
      return [];
    }
  }

  markAsRead(id: string) {
    const existing = this.getStoredNotifications();
    const updated = existing.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('local_notifications', JSON.stringify(updated));
    this.notificationsSubject.next(updated);
  }

  clearAllStoredNotifications() {
    localStorage.removeItem('local_notifications');
    this.notificationsSubject.next([]);
  }
}