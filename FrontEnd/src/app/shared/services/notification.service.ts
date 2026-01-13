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
    console.log('🔥 NotificationService initialized');
  }

  async requestPermission(): Promise<string | null> {
    try {
      console.log('🔔 Requesting notification permission...');
      
      // Request permission
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);

      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        
        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        
        console.log('✅ Service Worker registered:', registration);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker is ready');

        // Get FCM token with VAPID key
        const token = await getToken(this.messaging, {
          vapidKey:  environment.vapidKey,
          serviceWorkerRegistration: registration
        });

        if (token) {
          console.log('🔥 FCM Token:', token);
          
          // Save token to backend
          await this.saveFcmTokenToBackend(token);
          
          return token;
        } else {
          console.log('❌ No registration token available');
          return null;
        }
      } else {
        console.log('❌ Notification permission denied');
        return null;
      }
    } catch (error:  any) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  listenForMessages() {
    try {
      onMessage(this.messaging, (payload) => {
        console.log('📩 Message received (foreground):', payload);
        
        // Show notification
        if (payload.notification) {
          new Notification(payload.notification.title || 'New Message', {
            body: payload.notification.body,
            icon: payload.notification.icon || '/assets/icons/icon-192x192.png',
            data: payload.data
          });
        }
      });
      console.log('👂 Listening for foreground messages...');
    } catch (error) {
      console.error('❌ Error setting up message listener:', error);
    }
  }

  private async saveFcmTokenToBackend(token: string): Promise<void> {
    try {
        debugger;
      // Replace with your actual API endpoint
      const apiUrl = `${environment.apiBaseUrl}/api/notifications/register-token`;
      
      await this.http.post(apiUrl, { 
        fcmToken: token,
        deviceType: 'web'
      }).toPromise();
      
      console.log('✅ FCM token saved to backend');
    } catch (error) {
      // Don't throw - token is still valid even if backend save fails
    }
  }
}