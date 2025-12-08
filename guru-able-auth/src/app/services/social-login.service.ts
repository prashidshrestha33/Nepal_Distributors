import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

declare global {
  interface Window { google: any; FB: any; fbAsyncInit: any; onGoogleCredential?: any; }
}

@Injectable()
export class SocialLoginService {
  private googleInitialized = false;
  private pendingGoogleResolve: ((idToken: string) => void) | null = null;
  private scriptLoaded = false;

  constructor(private http: HttpClient) {}

  private loadGoogleScript(): Promise<void> {
    if (this.scriptLoaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      console.debug('[SocialLogin] loadGoogleScript: start');
      if (document.getElementById('google-client-script')) {
        this.scriptLoaded = true;
        console.debug('[SocialLogin] loadGoogleScript: script already present');
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.id = 'google-client-script';
      s.onload = () => {
        this.scriptLoaded = true;
        console.debug('[SocialLogin] loadGoogleScript: script loaded');
        resolve();
      };
      s.onerror = () => reject(new Error('Failed to load Google SDK'));
      document.head.appendChild(s);
    });
  }

  initGoogle(onCredential: (idToken: string) => void): Promise<void> {
    if (this.googleInitialized) return Promise.resolve();
    return this.loadGoogleScript().then(() => {
      console.debug('[SocialLogin] initGoogle: initializing google.accounts.id');
      window.onGoogleCredential = (response: any) => {
        console.debug('[SocialLogin] onGoogleCredential called', response);
        onCredential(response.credential);
        if (this.pendingGoogleResolve) {
          this.pendingGoogleResolve(response.credential);
          this.pendingGoogleResolve = null;
        }
      };
      const cfg = {
        client_id: environment.googleClientId,
        callback: (resp: any) => { window.onGoogleCredential(resp); }
      };
      console.debug('[SocialLogin] initGoogle: calling initialize with client id', cfg.client_id);
      window.google?.accounts?.id?.initialize(cfg);
      this.googleInitialized = true;
    });
  }

  renderGoogleButton(elementId: string) {
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      { theme: 'outline', size: 'large' }
    );
  }

  /**
   * Prompts Google sign-in, posts idToken to backend, and resolves with backend response.
   */
  signInWithGoogle(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // Prefer server-side popup helper flow which always shows Google account chooser
        if (environment.oauthHelperUrl) {
          console.debug('[SocialLogin] signInWithGoogle: opening oauth helper popup', environment.oauthHelperUrl);
          const data: any = await this.openAuthPopup(`${environment.oauthHelperUrl}/api/auth/google`);
          if (data?.type === 'oauth-success' && data.token) {
            // Send token (id_token) to backend to create app session
            try {
              const resp = await firstValueFrom(this.http.post(`${environment.apiUrl}/api/auth/google`, { idToken: data.token }));
              resolve(resp);
              return;
            } catch (err) {
              console.error('[SocialLogin] backend POST after popup failed', err);
              reject(err);
              return;
            }
          }
          return reject(new Error(data?.message || 'OAuth popup did not return a token'));
        }

        // Fallback to client-side Google Identity SDK flow
        await this.initGoogle(() => {});
        if (!window.google?.accounts?.id) return reject(new Error('Google SDK not loaded'));

        this.pendingGoogleResolve = (idToken: string) => {
          firstValueFrom(this.http.post(`${environment.apiUrl}/api/auth/google`, { idToken }))
            .then(resp => resolve(resp))
            .catch(err => reject(err));
        };

        window.google.accounts.id.prompt();
        setTimeout(() => {
          if (this.pendingGoogleResolve) {
            this.pendingGoogleResolve = null;
            reject(new Error('Google sign in timed out'));
          }
        }, 30000);
      } catch (err) {
        reject(err);
      }
    });
  }

  private openAuthPopup(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
      const popup = window.open(url, 'oauth_popup', features);
      if (!popup) { reject(new Error('Unable to open authentication popup')); return; }

      let intervalId: any = null;

      const receiveMessage = (event: MessageEvent) => {
        const data = event.data || {};
        if (data.type === 'oauth-success') {
          cleanup();
          try { resolve(data); } catch (e) { resolve(data); }
        } else if (data.type === 'oauth-error') {
          cleanup();
          reject(new Error(data.message || 'OAuth error'));
        }
      };

      const cleanup = () => {
        try { window.removeEventListener('message', receiveMessage); } catch {}
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
        try { popup.close(); } catch {}
      };

      window.addEventListener('message', receiveMessage, false);

      intervalId = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new Error('Authentication popup closed before completion'));
        }
      }, 500);
    });
  }

  initFacebook(): Promise<void> {
    return new Promise((resolve) => {
      if (window.FB) { resolve(); return; }
      window.fbAsyncInit = () => {
        window.FB.init({
          appId: environment.facebookAppId,
          cookie: true,
          xfbml: false,
          version: 'v15.0'
        });
        resolve();
      };
      const s = document.createElement('script');
      s.src = 'https://connect.facebook.net/en_US/sdk.js';
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    });
  }

  signInWithFacebook(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.initFacebook();
        window.FB.login((resp: any) => {
          if (resp.status === 'connected' && resp.authResponse) {
            resolve(resp.authResponse.accessToken);
          } else {
            reject(new Error('Facebook login cancelled or failed'));
          }
        }, { scope: 'email' });
      } catch (err) {
        reject(err);
      }
    });
  }
}
