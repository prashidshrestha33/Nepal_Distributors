// server/oauth-server.js

// Minimal Express example for OAuth popup flow
// Install dependencies: npm install express axios querystring cookie-parser
const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

const PORT = 49857;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '936699258306-jojc9ufg55ut1055s3nufrju2h9dldj4.apps.googleusercontent.com'; // set in environment, or hardcode for testing
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/api/auth/google/redirect`; // redirect URI the Google OAuth will call
const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FB_REDIRECT_URI = `http://localhost:${PORT}/api/auth/facebook/redirect`;

// Utility: render a small HTML page that posts a message to the opener
function renderPostMessagePage(payload, origin = '*') {
  // payload should be JSON-serializable
  const safe = JSON.stringify(payload).replace(/</g, '\\u003c');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Auth complete</title>
</head>
<body>
  <script>
    (function() {
      try {
        // send the data to the opener window
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(${safe}, ${JSON.stringify(origin)});
        } else {
          console.warn('No opener to receive message');
        }
      } catch (e) {
        console.error(e);
      }
      // close the popup after a short delay to allow message to be processed
      setTimeout(function(){ window.close(); }, 600);
    })();
  </script>
  <p>Signing you in…</p>
</body>
</html>`;
}

// Serve a route to start OAuth (redirect user to Google Auth)
app.get('/api/auth/google', (req, res) => {
  const state = req.query.state || 'state-' + Math.random().toString(36).slice(2);
  const scope = [
    'openid',
    'email',
    'profile'
  ].join(' ');
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + qs.stringify({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'select_account',
    state
  });

// Start Facebook OAuth flow (redirect user to Facebook Auth)
app.get('/api/auth/facebook', (req, res) => {
  const state = req.query.state || 'state-' + Math.random().toString(36).slice(2);
  const scope = ['email', 'public_profile'].join(',');
  const url = 'https://www.facebook.com/v12.0/dialog/oauth?' + qs.stringify({
    client_id: FB_APP_ID,
    redirect_uri: FB_REDIRECT_URI,
    state,
    scope
  });
  res.redirect(url);
});

// Facebook callback
app.get('/api/auth/facebook/redirect', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    const payload = { type: 'oauth-error', message: 'No code returned from Facebook' };
    return res.send(renderPostMessagePage(payload, req.headers.referer || '*'));
  }

  try {
    // Exchange code for access token
    const tokenResp = await axios.get('https://graph.facebook.com/v12.0/oauth/access_token', {
      params: {
        client_id: FB_APP_ID,
        redirect_uri: FB_REDIRECT_URI,
        client_secret: FB_APP_SECRET,
        code
      }
    });

    const tokenData = tokenResp.data; // contains access_token
    const accessToken = tokenData.access_token;

    const payload = { type: 'oauth-success', token: accessToken, provider: 'facebook' };
    const origin = (req.headers.origin || req.headers.referer || '*');
    return res.send(renderPostMessagePage(payload, origin));
  } catch (err) {
    console.error('Facebook token exchange failed', err?.response?.data || err.message || err);
    const payload = { type: 'oauth-error', message: 'Facebook token exchange failed' };
    return res.send(renderPostMessagePage(payload, req.headers.referer || '*'));
  }
});
  res.redirect(url);
});

// Callback /redirect that Google will call with ?code=...
app.get('/api/auth/google/redirect', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  if (!code) {
    const payload = { type: 'oauth-error', message: 'No code returned from provider' };
    // Use the exact origin of your Angular app in production.
    return res.send(renderPostMessagePage(payload, req.headers.referer || '*'));
  }

  try {
    // Exchange the authorization code for tokens with Google
    const tokenResp = await axios.post(
      'https://oauth2.googleapis.com/token',
      qs.stringify({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const tokenData = tokenResp.data; // contains access_token, id_token, refresh_token (maybe)
    // You should verify id_token, store session, etc. For demo, we'll forward the id_token to the client.
    const jwtToken = tokenData.id_token || tokenData.access_token;

    const payload = { type: 'oauth-success', token: jwtToken, provider: 'google' };
    // Use the exact origin of the opener (frontend) if known, e.g. "https://localhost:4200"
    const origin = (req.headers.origin || req.headers.referer || '*');
    return res.send(renderPostMessagePage(payload, origin));

  } catch (err) {
    console.error('Token exchange failed', err?.response?.data || err.message || err);
    const payload = { type: 'oauth-error', message: 'Token exchange failed' };
    return res.send(renderPostMessagePage(payload, req.headers.referer || '*'));
  }
});

app.listen(PORT, () => {
  console.log(`OAuth helper server listening on http://localhost:${PORT}`);
});
