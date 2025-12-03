import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window { google: any; FB: any; fbAsyncInit: any; }
}

@Injectable()
export class SocialLoginService {
  private googleInitialized = false;
  private pendingGoogleResolve: ((idToken: string) => void) | null = null;

  constructor() {}

  initGoogle(onCredential: (idToken: string) => void) {
    if (this.googleInitialized) return;
    window['onGoogleCredential'] = (response: any) => {
      onCredential(response.credential);
      if (this.pendingGoogleResolve) {
        this.pendingGoogleResolve(response.credential);
        this.pendingGoogleResolve = null;
      }
    };
    const cfg = {
      client_id: environment.googleClientId,
      callback: (resp: any) => { window['onGoogleCredential'](resp); }
    };
    window.google?.accounts?.id?.initialize(cfg);
    this.googleInitialized = true;
  }

  renderGoogleButton(elementId: string) {
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      { theme: 'outline', size: 'large' }
    );
  }

  signInWithGoogle(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.id) return reject(new Error('Google SDK not loaded'));
      this.pendingGoogleResolve = resolve;
      window.google.accounts.id.prompt();
      setTimeout(() => {
        if (this.pendingGoogleResolve) {
          this.pendingGoogleResolve = null;
          reject(new Error('Google sign in timed out'));
        }
      }, 30000);
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
