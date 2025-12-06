import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Standard email/password login (calls backend and saves token)
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.api}/api/auth/login`, { email, password })
      .pipe(tap(res => this.saveToken(res?.token)));
  }

  // Register endpoint (calls backend and saves token)
  register(payload: any): Observable<any> {
    return this.http.post<any>(`${this.api}/api/auth/registernewuser`, payload)
      .pipe(tap(res => this.saveToken(res?.token)));
  }

  // Server-side social login endpoints (exchange idToken/accessToken for your JWT)
  googleLogin(idToken: string): Observable<any> {
    return this.http.post<any>(`${this.api}/api/auth/google`, { idToken })
      .pipe(tap(res => this.saveToken(res?.token)));
  }

  facebookLogin(accessToken: string): Observable<any> {
    return this.http.post<any>(`${this.api}/api/auth/facebook`, { accessToken })
      .pipe(tap(res => this.saveToken(res?.token)));
  }

  // Opens a popup to start the OAuth flow on your backend and listens for a postMessage
  // from the popup window. Your backend route should perform the OAuth dance and, on
  // completion, post a message back to the opener window like:
  // window.opener.postMessage({ type: 'oauth-success', token: '<JWT>' }, '<your-origin>');
  // or on error:
  // window.opener.postMessage({ type: 'oauth-error', message: '...' }, '<your-origin>');
  //
  // Usage:
  // auth.signInWithProvider('google').subscribe({ next: () => ..., error: () => ... })
  signInWithProvider(provider: 'google' | 'facebook' | string): Observable<any> {
    if (!provider) {
      return throwError(() => new Error('Provider is required'));
    }

    const popupUrl = `${this.api}/api/auth/${provider}`; // adjust to your backend route
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;

    return new Observable<any>((observer) => {
      const popup = window.open(popupUrl, `oauth_${provider}`, features);
      if (!popup) {
        observer.error(new Error('Unable to open authentication popup'));
        return;
      }

      let intervalId: any = null;

      const receiveMessage = (event: MessageEvent) => {
        // Optionally validate event.origin here if your backend posts only to your known origin.
        // Example: if (event.origin !== window.location.origin) return;

        const data = event.data || {};
        if (data.type === 'oauth-success') {
          try { this.saveToken(data.token); } catch {}
          cleanup();
          observer.next(data);
          observer.complete();
        } else if (data.type === 'oauth-error') {
          cleanup();
          observer.error(new Error(data.message || 'OAuth error'));
        }
      };

      const cleanup = () => {
        try { window.removeEventListener('message', receiveMessage); } catch {}
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
        try { popup.close(); } catch {}
      };

      window.addEventListener('message', receiveMessage, false);

      // Poll for popup closed without a message (user cancelled)
      intervalId = setInterval(() => {
        if (popup.closed) {
          cleanup();
          observer.error(new Error('Authentication popup closed before completion'));
        }
      }, 500);

      // Teardown logic if subscriber unsubscribes
      return () => {
        cleanup();
      };
    });
  }

  // Local token helpers
  saveToken(token?: string) {
    if (token) {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}