/**
 * scripts/ga/build-priority-list.js
 *
 * Pulls GSC impression data and builds a prioritized list of URLs
 * for the Indexing API. Saves to output/ for auto-index.js --priority.
 */

import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

const res = await webmasters.searchanalytics.query({
  siteUrl: 'sc-domain:weddingcounselors.com',
  requestBody: {
    startDate: '2026-01-27',
    endDate: '2026-02-26',
    dimensions: ['page'],
    rowLimit: 25000,
  }
});

const rows = res.data.rows || [];

const categorized = rows.map(r => {
  const url = r.keys[0];
  const urlPath = url.replace('https://www.weddingcounselors.com', '');
  const parts = urlPath.split('/').filter(Boolean);
  let cat = 'other';
  if (parts[0] === 'premarital-counseling') {
    if (parts.length === 4) cat = 'profile';
    else if (parts.length === 3) cat = 'city';
    else if (parts.length === 2) cat = 'state';
  }
  return { url, cat, impressions: r.impressions, clicks: r.clicks };
});

// Priority: cities first, then profiles by clicks, then by impressions
const priority = categorized
  .filter(p => p.cat === 'city' || p.cat === 'profile')
  .sort((a, b) => {
    if (a.cat !== b.cat) return a.cat === 'city' ? -1 : 1;
    if (b.clicks !== a.clicks) return b.clicks - a.clicks;
    return b.impressions - a.impressions;
  });

console.log('Priority URLs breakdown:');
console.log('  City pages:', priority.filter(p => p.cat === 'city').length);
console.log('  Profile pages:', priority.filter(p => p.cat === 'profile').length);
console.log('\n  Top 15:');
priority.slice(0, 15).forEach(p => {
  console.log(`    ${p.cat.padEnd(8)} ${String(p.impressions).padStart(4)}imp ${String(p.clicks).padStart(3)}clk  ${p.url.replace('https://www.weddingcounselors.com', '')}`);
});

const outputDir = path.join(import.meta.dirname, 'output');
fs.mkdirSync(outputDir, { recursive: true });

const today = new Date().toISOString().split('T')[0];
const filePath = path.join(outputDir, `non-indexed-urls-${today}.txt`);
fs.writeFileSync(filePath, priority.map(p => p.url).join('\n'));
console.log(`\nSaved ${priority.length} priority URLs to ${filePath}`);
