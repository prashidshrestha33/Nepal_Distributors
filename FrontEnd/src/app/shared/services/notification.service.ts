import { Injectable, inject } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

import { ApiGatewayService } from './api-gateway.service';
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private messaging = inject(Messaging);
  private http = inject(HttpClient);

  constructor(private apiGateway: ApiGatewayService) {
  }

  async requestPermission(): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        await navigator.serviceWorker.ready;

        // Get FCM token with VAPID key
        const token = await getToken(this.messaging, {
          vapidKey:  environment.vapidKey,
          serviceWorkerRegistration: registration
        });

        if (token) {
          var fmc=await this.saveFcmTokenToBackend(token);
          
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
        alert(payload.notification.title);
          new Notification(payload.notification.title || 'New Message', {
            body: payload.notification.body,
            data: payload.data
          });
        }
      });
    } catch (error) {
    }
  }
 saveFcmTokenToBackend(token: string) {
  try {
    debugger;
    const apiUrl = `${environment.apiBaseUrl}/api/Users/setFCM?fciid=${token}`;

    return  this.apiGateway.post(
      apiUrl,
      {},                   
      { requiresAuth: true });

  } catch (error) {
    console.error("FCM save failed", error);
     return [];
  }
}

}