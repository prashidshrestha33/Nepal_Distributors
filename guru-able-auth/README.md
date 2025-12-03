# Guru Able Auth (Angular)

This is a minimal Angular 18 scaffold for authentication UI:
- Email/password signup & login
- Google Sign-In (GSI id_token)
- Facebook Login (FB SDK access token)
- Simple Dashboard

Usage:
1. Install Node.js (compatible with Angular 18) and npm.
2. cd guru-able-auth
3. npm install
4. npx ng serve --open

Before running:
- Edit src/environments/environment.ts to set apiUrl, googleClientId, and facebookAppId.
- Copy Guru Able template assets (CSS/JS/images) into src/assets/guruable/ or adjust index.html.
- Ensure your backend provides these endpoints:
  POST /api/auth/login
  POST /api/auth/register
  POST /api/auth/google
  POST /api/auth/facebook

Notes:
- The project created by this script is minimal and intended for development/testing.
- For production, secure tokens, use HTTPS, and follow OAuth best practices.
