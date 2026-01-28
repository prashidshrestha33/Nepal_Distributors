import { Injectable, inject } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private messaging = inject(Messaging);
  private http = inject(HttpClient);

  constructor() {
  }

  async requestPermission(): Promise<string | null> {
    try {
      
      // Request permission
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        
        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        // Get FCM token with VAPID key
        const token = await getToken(this.messaging, {
          vapidKey:  environment.vapidKey,
          serviceWorkerRegistration: registration
        });

        if (token) {
          
          // Save token to backend
          await this.saveFcmTokenToBackend(token);
          
          return token;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error:  any) {
      return null;
    }
  }

  listenForMessages() {
    try {
      onMessage(this.messaging, (payload) => {
        
        // Show notification
        if (payload.notification) {
          new Notification(payload.notification.title || 'New Message', {
            body: payload.notification.body,
            icon: payload.notification.icon || '/assets/icons/icon-192x192.png',
            data: payload.data
          });
        }
      });
    } catch (error) {
    }
  }

  private async saveFcmTokenToBackend(token: string): Promise<void> {
    try {
      // Replace with your actual API endpoint
      const apiUrl = `${environment.apiBaseUrl}/api/notifications/register-token`;
      
      await this.http.post(apiUrl, { 
        fcmToken: token,
        deviceType: 'web'
      }).toPromise();
    } catch (error) {
      // Don't throw - token is still valid even if backend save fails
    }
  }
}