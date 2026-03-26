/**
 * scripts/gsc/request-recrawl.js
 *
 * Requests Google re-crawl non-indexed URLs using the Indexing API.
 * Prioritizes high-value pages (states, cities, top profiles).
 *
 * Usage:
 *   node scripts/gsc/request-recrawl.js                    # Submit top priority non-indexed URLs
 *   node scripts/gsc/request-recrawl.js --limit 50         # Limit to N submissions
 *   node scripts/gsc/request-recrawl.js --from-file <path> # Submit URLs from a text file
 *   node scripts/gsc/request-recrawl.js --dry-run          # Show what would be submitted
 *
 * Daily limit: ~200 URLs/day (Google Indexing API quota)
 */

import 'dotenv/config';
import { google } from 'googleapis';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 100;
const fileIdx = args.indexOf('--from-file');
const FROM_FILE = fileIdx !== -1 ? args[fileIdx + 1] : null;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function submitUrl(url, token) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ url, type: 'URL_UPDATED' });
    const req = https.request({
      hostname: 'indexing.googleapis.com',
      path: '/v3/urlNotifications:publish',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, ok: res.statusCode === 200, response: d }));
    });
    req.on('error', (e) => resolve({ status: 0, ok: false, response: e.message }));
    req.write(body);
    req.end();
  });
}

function getUrlsFromCoverageReport() {
  // Find the most recent coverage report
  const gaOutputDir = path.join(__dirname, '..', 'ga', 'output');
  const coverageFiles = fs.readdirSync(gaOutputDir)
    .filter(f => f.startsWith('coverage-report-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (coverageFiles.length === 0) {
    console.error('No coverage report found. Run index-coverage-report.js first.');
    process.exit(1);
  }

  const reportPath = path.join(gaOutputDir, coverageFiles[0]);
  console.log(`Using coverage report: ${coverageFiles[0]}`);

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const notIndexed = report.results.filter(r => r.verdict !== 'PASS');

  // Priority order: states > cities > profiles
  const priorityOrder = { state: 1, city: 2, blog: 3, profile: 4, other: 5 };
  notIndexed.sort((a, b) => {
    const pa = priorityOrder[a.category] || 99;
    const pb = priorityOrder[b.category] || 99;
    return pa - pb;
  });

  return notIndexed.map(r => r.url);
}

async function main() {
  let urls;

  if (FROM_FILE) {
    urls = fs.readFileSync(FROM_FILE, 'utf8').split('\n').filter(Boolean);
    console.log(`Loaded ${urls.length} URLs from ${FROM_FILE}`);
  } else {
    urls = getUrlsFromCoverageReport();
    console.log(`Found ${urls.length} non-indexed URLs from coverage report`);
  }

  urls = urls.slice(0, LIMIT);
  console.log(`Submitting ${urls.length} URLs (limit: ${LIMIT})${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  if (DRY_RUN) {
    urls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
    console.log('\nDry run complete. Remove --dry-run to actually submit.');
    return;
  }

  const { token } = await oauth2Client.getAccessToken();
  let ok = 0;
  let fail = 0;
  let rateLimited = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const shortUrl = url.replace('https://www.weddingcounselors.com', '');

    const result = await submitUrl(url, token);

    if (result.ok) {
      ok++;
      console.log(`  \x1b[32m✓\x1b[0m [${i + 1}/${urls.length}] ${shortUrl}`);
    } else if (result.status === 429) {
      rateLimited++;
      console.log(`  \x1b[33m⏳\x1b[0m [${i + 1}/${urls.length}] ${shortUrl} (rate limited — stopping)`);
      break;
    } else {
      fail++;
      console.log(`  \x1b[31m✗\x1b[0m [${i + 1}/${urls.length}] ${shortUrl} (${result.status}: ${result.response.substring(0, 100)})`);
    }

    // Rate limit: ~1 req/sec
    if (i < urls.length - 1) await sleep(1500);
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Submitted: ${ok}`);
  console.log(`  Failed:    ${fail}`);
  console.log(`  Rate limited: ${rateLimited}`);
  console.log(`\nGoogle will re-crawl these URLs within 1-2 days.`);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
