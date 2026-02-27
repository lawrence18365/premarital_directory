/**
 * scripts/ga/auth.js
 *
 * ONE-TIME OAuth flow — adds Google Analytics scopes alongside Search Console.
 * Run this once: node scripts/ga/auth.js
 *
 * After authorizing, paste the new GOOGLE_REFRESH_TOKEN into .env.
 * The new token works for BOTH GSC and GA — your existing GSC scripts won't break.
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
  access_type: 'offline',
  prompt: 'consent',          // forces new refresh token
  scope: [
    // Search Console
    'https://www.googleapis.com/auth/webmasters',
    // Google Analytics
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics.edit',
    // Indexing API
    'https://www.googleapis.com/auth/indexing',
    // PageSpeed (uses API key, but scope doesn't hurt)
    'https://www.googleapis.com/auth/cloud-platform',
  ],
});

console.log('\n--- Full Google API OAuth (GSC + GA + Indexing + Cloud) ---');
console.log('One token to rule them all.\\n');

// Open browser (macOS)
exec(`open "${authUrl}"`, (err) => {
  if (err) {
    console.log('Could not auto-open browser. Visit this URL manually:\n');
    console.log(authUrl);
  }
});

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
    console.log('REFRESH TOKEN (save this!):');
    console.log(tokens.refresh_token);
    console.log('\n--- Replace in your .env ---');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('----------------------------\n');
    console.log('This token works for BOTH Search Console and Google Analytics.');
    console.log('Your existing GSC scripts will continue to work.\n');

    if (!tokens.refresh_token) {
      console.warn('WARNING: No refresh token returned.');
      console.warn('Go to https://myaccount.google.com/permissions, revoke "Wedding Counselors" access, then re-run.\n');
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
