/**
 * scripts/gsc/auth.js
 *
 * ONE-TIME OAuth flow for Google Search Console.
 * Run this once: node scripts/gsc/auth.js
 *
 * What it does:
 *   1. Opens your browser to Google's OAuth consent screen
 *   2. Listens on localhost for the callback
 *   3. Exchanges the auth code for tokens
 *   4. Prints your refresh token — paste it into .env as GOOGLE_REFRESH_TOKEN
 *
 * Required env vars (set in .env before running):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI  (default: http://localhost:3001/oauth2callback)
 */

import 'dotenv/config';
import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';
import { exec } from 'child_process';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI = 'http://localhost:3001/oauth2callback',
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('ERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',   // gets refresh token
  prompt: 'consent',        // forces refresh token even if already authorized
  scope: ['https://www.googleapis.com/auth/webmasters'],
});

console.log('\n--- Google Search Console OAuth ---');
console.log('Opening browser to authorize...\n');

// Open browser (macOS)
exec(`open "${authUrl}"`, (err) => {
  if (err) {
    console.log('Could not auto-open browser. Visit this URL manually:\n');
    console.log(authUrl);
  }
});

// Parse port from redirect URI
const redirectPort = parseInt(new URL(GOOGLE_REDIRECT_URI).port, 10) || 3001;

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) {
    res.end('Not found');
    return;
  }

  const params = new URL(req.url, GOOGLE_REDIRECT_URI).searchParams;
  const code = params.get('code');
  const error = params.get('error');

  if (error) {
    res.end(`<h2>Authorization failed: ${error}</h2>`);
    console.error('\nAuthorization denied:', error);
    server.close();
    return;
  }

  if (!code) {
    res.end('<h2>No code received. Try again.</h2>');
    server.close();
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.end(`
      <h2>Authorization successful!</h2>
      <p>You can close this tab and go back to your terminal.</p>
    `);

    console.log('\n=== SUCCESS ===\n');
    console.log('ACCESS TOKEN (short-lived, ignore):');
    console.log(tokens.access_token);
    console.log('\nREFRESH TOKEN (save this!):');
    console.log(tokens.refresh_token);
    console.log('\n--- Add to your .env ---');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('------------------------\n');

    if (!tokens.refresh_token) {
      console.warn('WARNING: No refresh token returned.');
      console.warn('This usually means the app was already authorized.');
      console.warn('Go to https://myaccount.google.com/permissions, revoke access, then re-run this script.\n');
    }
  } catch (err) {
    res.end(`<h2>Token exchange failed: ${err.message}</h2>`);
    console.error('\nToken exchange error:', err.message);
  }

  server.close();
});

server.listen(redirectPort, () => {
  console.log(`Waiting for Google callback on port ${redirectPort}...`);
});
