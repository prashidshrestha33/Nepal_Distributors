// services/social-auth-simple.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SocialUser } from '../models/auth.models';

declare const google: any;
declare const FB: any;

@Injectable({
  providedIn: 'root'
})
export class SocialAuthSimpleService {
  private googleInitialized = false;
  private facebookInitialized = false;

  constructor() {
    this.waitForGoogle();
    this.waitForFacebook();
  }

  private waitForGoogle() {
    const check = () => {
      if (typeof google !== 'undefined' && google?. accounts?. id) {
        this.googleInitialized = true;
        console.log('✅ Google SDK loaded');
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  }

  private waitForFacebook() {
    const check = () => {
      if (typeof FB !== 'undefined') {
        try {
          FB.init({
            appId: environment.facebookAppId,
            cookie:  true,
            xfbml: true,
            version: 'v18.0'
          });
          this.facebookInitialized = true;
          console.log('✅ Facebook SDK loaded');
        } catch (error) {
          console.error('Facebook init error:', error);
        }
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  }

  /**
   * Sign in with Google using popup (no One Tap)
   * More reliable and works everywhere
   */
  signInWithGoogle(): Promise<SocialUser> {
    return new Promise((resolve, reject) => {
      if (!this.googleInitialized) {
        reject(new Error('Google SDK not ready.  Please wait a moment. '));
        return;
      }

      try {
        // Use OAuth popup instead of One Tap
        const client = google.accounts.oauth2.initTokenClient({
          client_id:  environment.googleClientId,
          scope: 'email profile',
          callback: async (tokenResponse:  any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                // Get user info from Google
                const userInfo = await this.getGoogleUserInfo(tokenResponse. access_token);
                const user:  SocialUser = {
                  id: userInfo.id,
                  name: userInfo.name,
                  email: userInfo.email,
                  photoUrl: userInfo.picture || '',
                  provider: 'GOOGLE',
                  token: tokenResponse.access_token
                };
                console.log('✅ Google user created:', user);
                resolve(user);
              } catch (error) {
                reject(new Error('Failed to get Google user info'));
              }
            } else {
              reject(new Error('No access token received'));
            }
          },
        });

        // Trigger popup
        client.requestAccessToken();
      } catch (error) {
        console.error('Google sign-in error:', error);
        reject(error);
      }
    });
  }

  /**
   * Get Google user info from access token
   */
  private async getGoogleUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google user info');
    }

    return response.json();
  }

  /**
   * Sign in with Facebook
   */
  signInWithFacebook(): Promise<SocialUser> {
    return new Promise((resolve, reject) => {
      if (!this.facebookInitialized) {
        reject(new Error('Facebook SDK not ready. Please wait a moment.'));
        return;
      }

      try {
        FB.login((response: any) => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;

            FB.api('/me', { fields: 'id,name,email,picture' }, (userInfo: any) => {
              if (userInfo && ! userInfo.error) {
                const user: SocialUser = {
                  id: userInfo. id,
                  name: userInfo.name,
                  email: userInfo.email || '',
                  photoUrl: userInfo.picture?. data?.url || '',
                  provider: 'FACEBOOK',
                  token: accessToken
                };
                console.log('✅ Facebook user created:', user);
                resolve(user);
              } else {
                reject(new Error('Failed to get Facebook user info'));
              }
            });
          } else {
            reject(new Error('Facebook login cancelled'));
          }
        }, { scope: 'public_profile,email' });
      } catch (error) {
        console.error('Facebook sign-in error:', error);
        reject(error);
      }
    });
  }

  signOut(): void {
    try {
      if (this.googleInitialized && typeof google !== 'undefined') {
        google.accounts.id.disableAutoSelect();
      }
      if (this.facebookInitialized && typeof FB !== 'undefined') {
        FB.logout(() => console.log('Logged out from Facebook'));
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
}