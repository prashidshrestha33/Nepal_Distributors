import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, WebSocketSubject, webSocket } from 'rxjs';
import { environment } from '../../../environments/environment';
import { filter, map } from 'rxjs/operators';

export interface RealtimeUpdate {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
  module: string;
  data: any;
  timestamp: Date;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeUpdateService {
  private wsUrl = environment.apiBaseUrl.replace('https', 'wss').replace('http', 'ws') + '/ws';
  private ws$: WebSocketSubject<any> | null = null;
  private updates$ = new Subject<RealtimeUpdate>();
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initializeConnection();
  }

  /**
   * Initialize WebSocket connection
   */
  private initializeConnection(): void {
    try {
      this.ws$ = webSocket({
        url: this.wsUrl,
        openObserver: {
          next: () => {
            console.log('WebSocket connected');
            this.connectionStatus$.next(true);
            this.reconnectAttempts = 0;
          }
        },
        closeObserver: {
          next: () => {
            console.log('WebSocket disconnected');
            this.connectionStatus$.next(false);
            this.attemptReconnect();
          }
        }
      });

      this.ws$.subscribe(
        (message) => this.handleMessage(message),
        (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatus$.next(false);
          this.attemptReconnect();
        }
      );
    } catch (error) {
      console.warn('WebSocket not available, falling back to polling');
      this.fallbackToPolling();
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    try {
      const update: RealtimeUpdate = {
        type: message.type,
        module: message.module,
        data: message.data,
        timestamp: new Date(message.timestamp),
        userId: message.userId
      };
      this.updates$.next(update);
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeConnection();
      }, delay);
    }
  }

  /**
   * Fallback to polling if WebSocket unavailable
   */
  private fallbackToPolling(): void {
    setInterval(() => {
      // Polling implementation would go here
      // This is a placeholder for actual polling logic
    }, 30000); // Poll every 30 seconds
  }

  /**
   * Get updates for a specific module
   */
  getModuleUpdates(module: string) {
    return this.updates$.pipe(
      filter(update => update.module === module)
    );
  }

  /**
   * Get updates of a specific type
   */
  getUpdatesByType(type: RealtimeUpdate['type']) {
    return this.updates$.pipe(
      filter(update => update.type === type)
    );
  }

  /**
   * Get all updates
   */
  getAllUpdates() {
    return this.updates$.asObservable();
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Send message through WebSocket
   */
  sendMessage(message: any): void {
    if (this.ws$ && this.connectionStatus$.value) {
      this.ws$.next(message);
    }
  }

  /**
   * Subscribe to user's own updates
   */
  subscribeToUserUpdates(userId: string) {
    this.sendMessage({
      action: 'subscribe',
      userId: userId
    });
  }

  /**
   * Subscribe to specific module updates
   */
  subscribeToModule(module: string) {
    this.sendMessage({
      action: 'subscribe_module',
      module: module
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws$) {
      this.ws$.complete();
      this.ws$ = null;
      this.connectionStatus$.next(false);
    }
  }
}
