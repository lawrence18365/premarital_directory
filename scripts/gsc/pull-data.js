/**
 * scripts/gsc/pull-data.js
 *
 * Pulls Google Search Console data and saves to scripts/gsc/output/
 *
 * Run: node scripts/gsc/pull-data.js
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN  (from auth.js)
 *   GSC_SITE_URL          e.g. sc-domain:weddingcounselors.com  OR  https://www.weddingcounselors.com/
 *
 * Outputs:
 *   scripts/gsc/output/queries.json   — query-level data (impressions, clicks, position, CTR)
 *   scripts/gsc/output/pages.json     — page-level data
 *   scripts/gsc/output/combined.json  — query+page rows (best for analysis)
 */

import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GSC_SITE_URL,
} = process.env;

const MISSING = ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN','GSC_SITE_URL']
  .filter(k => !process.env[k]);

if (MISSING.length) {
  console.error('ERROR: Missing env vars:', MISSING.join(', '));
  console.error('Make sure you have run auth.js and saved GOOGLE_REFRESH_TOKEN to .env');
  process.exit(1);
}

// --- Auth setup ---
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
);
oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

const sc = google.webmasters({ version: 'v3', auth: oauth2Client });

// --- Date range: last 28 days ---
function isoDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}
const END_DATE   = isoDate(3);   // GSC has ~3 day lag
const START_DATE = isoDate(31);  // 28 days + 3 day lag

async function query(dimensions, rowLimit = 25000) {
  const res = await sc.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: {
      startDate: START_DATE,
      endDate:   END_DATE,
      dimensions,
      rowLimit,
      dataState: 'all',
    },
  });
  return res.data.rows || [];
}

function save(filename, data) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const file = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`  Saved ${data.length} rows → ${file}`);
}

async function main() {
  console.log(`\nPulling GSC data for: ${GSC_SITE_URL}`);
  console.log(`Date range: ${START_DATE} → ${END_DATE}\n`);

  // 1) Verify site access
  const sites = await sc.sites.list();
  const siteList = (sites.data.siteEntry || []).map(s => s.siteUrl);
  console.log('Sites in your GSC account:');
  siteList.forEach(s => console.log(' ', s));
  if (!siteList.includes(GSC_SITE_URL)) {
    console.warn(`\nWARNING: "${GSC_SITE_URL}" not found in site list above.`);
    console.warn('Check GSC_SITE_URL — try with and without trailing slash, or use sc-domain: prefix.\n');
  }
  console.log('');

  // 2) True site totals (no dimensions = no anonymization loss)
  console.log('Fetching true site totals...');
  const totalsRes = await sc.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: {
      startDate: START_DATE,
      endDate:   END_DATE,
      dataState: 'all',
    },
  });
  const siteTotals = totalsRes.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const trueTotals = {
    clicks:      siteTotals.clicks,
    impressions: siteTotals.impressions,
    ctr:         parseFloat((siteTotals.ctr * 100).toFixed(2)),
    position:    parseFloat(siteTotals.position.toFixed(1)),
  };
  console.log(`  TRUE totals → ${trueTotals.clicks} clicks | ${trueTotals.impressions} impressions | ${trueTotals.ctr}% CTR | pos ${trueTotals.position}`);

  // 3) Daily data (date dimension — accurate per-day totals for trend analysis)
  console.log('Fetching daily data...');
  const dailyRows = await query(['date']);
  const dailyData = dailyRows.map(r => ({
    date:        r.keys[0],
    clicks:      r.clicks,
    impressions: r.impressions,
    ctr:         parseFloat((r.ctr * 100).toFixed(2)),
    position:    parseFloat(r.position.toFixed(1)),
  })).sort((a, b) => a.date.localeCompare(b.date));
  save('daily.json', dailyData);

  // 4) Query-level data
  console.log('Fetching query data...');
  const queryRows = await query(['query']);
  const queryData = queryRows.map(r => ({
    query:       r.keys[0],
    clicks:      r.clicks,
    impressions: r.impressions,
    ctr:         parseFloat((r.ctr * 100).toFixed(2)),
    position:    parseFloat(r.position.toFixed(1)),
  }));
  save('queries.json', queryData);

  // 5) Page-level data
  console.log('Fetching page data...');
  const pageRows = await query(['page']);
  const pageData = pageRows.map(r => ({
    page:        r.keys[0],
    clicks:      r.clicks,
    impressions: r.impressions,
    ctr:         parseFloat((r.ctr * 100).toFixed(2)),
    position:    parseFloat(r.position.toFixed(1)),
  }));
  save('pages.json', pageData);

  // 6) Query + Page combined (most useful for finding opportunities)
  console.log('Fetching query+page combined data...');
  const combinedRows = await query(['query', 'page']);
  const combinedData = combinedRows.map(r => ({
    query:       r.keys[0],
    page:        r.keys[1],
    clicks:      r.clicks,
    impressions: r.impressions,
    ctr:         parseFloat((r.ctr * 100).toFixed(2)),
    position:    parseFloat(r.position.toFixed(1)),
  }));
  save('combined.json', combinedData);

  // Save true totals alongside row-level data
  save('totals.json', {
    trueTotals,
    dateRange: { start: START_DATE, end: END_DATE },
    rowCoverage: {
      queryRowClicks: queryData.reduce((s, r) => s + r.clicks, 0),
      queryRowImpressions: queryData.reduce((s, r) => s + r.impressions, 0),
      pctClicksCaptured: ((queryData.reduce((s, r) => s + r.clicks, 0) / trueTotals.clicks) * 100).toFixed(1) + '%',
      pctImpressionsCaptured: ((queryData.reduce((s, r) => s + r.impressions, 0) / trueTotals.impressions) * 100).toFixed(1) + '%',
      note: 'GSC API anonymizes low-volume queries. Row-level data captures a subset of true totals.',
    },
  });

  // 7) Quick local summary
  console.log('\n--- Quick Summary (TRUE totals from GSC) ---');
  console.log(`Total clicks:      ${trueTotals.clicks.toLocaleString()}`);
  console.log(`Total impressions: ${trueTotals.impressions.toLocaleString()}`);
  console.log(`Avg CTR:           ${trueTotals.ctr}%`);
  console.log(`Avg position:      ${trueTotals.position}`);

  const rowClicks = queryData.reduce((s, r) => s + r.clicks, 0);
  const rowImpressions = queryData.reduce((s, r) => s + r.impressions, 0);
  console.log(`\nRow-level coverage: ${rowClicks}/${trueTotals.clicks} clicks (${((rowClicks/trueTotals.clicks)*100).toFixed(0)}%) | ${rowImpressions}/${trueTotals.impressions} impressions (${((rowImpressions/trueTotals.impressions)*100).toFixed(0)}%)`);
  console.log('(Gap = anonymized long-tail queries hidden by GSC API)');

  const nearWins = queryData.filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 5)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);
  console.log('\nTop near-win keywords (pos 4–20, 5+ impressions):');
  nearWins.forEach(r =>
    console.log(`  [pos ${r.position}] ${r.query} — ${r.impressions} imp / ${r.clicks} clicks`)
  );

  console.log('\nDone. Run analyze.js next for AI-powered recommendations.');
}

main().catch(err => {
  console.error('Error:', err.message);
  if (err.code === 401 || err.message.includes('invalid_grant')) {
    console.error('\nAuth error — refresh token may be expired or revoked.');
    console.error('Re-run auth.js to get a new refresh token.');
  }
  process.exit(1);
});
