/**
 * scripts/ga/pull-analytics.js
 *
 * Pulls comprehensive GA4 + GSC data and generates a weekly digest.
 * Run manually or via GitHub Actions cron.
 *
 * Usage: node scripts/ga/pull-analytics.js
 * Output: scripts/ga/output/weekly-digest.json + prints summary to stdout
 */

import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const GA_PROPERTY_ID = '501043083';

// ── Auth ────────────────────────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });
const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

// ── GA4 Helper ──────────────────────────────────────────────────────────
async function gaReport(body) {
  const res = await analyticsData.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: body,
  });
  return res.data;
}

// ── Pull Everything ─────────────────────────────────────────────────────
async function main() {
  const now = new Date();
  const report = { generatedAt: now.toISOString(), period: {} };

  // ═══ GA4: Site Summary (this week vs last week) ═══
  console.log('Pulling GA4 site summary...');
  const summary = await gaReport({
    dateRanges: [
      { startDate: '7daysAgo', endDate: 'today', name: 'thisWeek' },
      { startDate: '14daysAgo', endDate: '8daysAgo', name: 'lastWeek' },
    ],
    metrics: [
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
      { name: 'engagedSessions' },
      { name: 'newUsers' },
    ],
  });

  const metricNames = ['users', 'sessions', 'pageViews', 'avgDuration', 'bounceRate', 'engagedSessions', 'newUsers'];
  const weeks = {};
  summary.rows.forEach((row, i) => {
    const label = i === 0 ? 'thisWeek' : 'lastWeek';
    weeks[label] = {};
    row.metricValues.forEach((v, j) => {
      weeks[label][metricNames[j]] = parseFloat(v.value);
    });
  });

  // Calculate deltas
  const deltas = {};
  metricNames.forEach(m => {
    const curr = weeks.thisWeek[m] || 0;
    const prev = weeks.lastWeek[m] || 0;
    deltas[m] = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
  });

  report.weekOverWeek = { ...weeks, deltas };

  // ═══ GA4: Top Pages ═══
  console.log('Pulling top pages...');
  const topPages = await gaReport({
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'totalUsers' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 30,
  });

  report.topPages = (topPages.rows || []).map(r => ({
    path: r.dimensionValues[0].value,
    views: parseInt(r.metricValues[0].value),
    users: parseInt(r.metricValues[1].value),
    avgDuration: Math.round(parseFloat(r.metricValues[2].value)),
    bounceRate: Math.round(parseFloat(r.metricValues[3].value) * 100),
  }));

  // ═══ GA4: Traffic Sources ═══
  console.log('Pulling traffic sources...');
  const sources = await gaReport({
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'screenPageViewsPerSession' },
    ],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  });

  report.trafficSources = (sources.rows || []).map(r => ({
    channel: r.dimensionValues[0].value,
    sessions: parseInt(r.metricValues[0].value),
    engagementRate: Math.round(parseFloat(r.metricValues[1].value) * 100),
    pagesPerSession: parseFloat(r.metricValues[2].value).toFixed(1),
  }));

  // ═══ GA4: Events Summary ═══
  console.log('Pulling events...');
  const events = await gaReport({
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 20,
  });

  report.events = (events.rows || []).map(r => ({
    event: r.dimensionValues[0].value,
    count: parseInt(r.metricValues[0].value),
    users: parseInt(r.metricValues[1].value),
  }));

  // ═══ GA4: Organic Landing Pages ═══
  console.log('Pulling organic landing pages...');
  const organicLanding = await gaReport({
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'landingPage' }],
    metrics: [
      { name: 'sessions' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
    ],
    dimensionFilter: {
      filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { value: 'Organic Search', matchType: 'EXACT' } },
    },
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 20,
  });

  report.organicLandingPages = (organicLanding.rows || []).map(r => ({
    path: r.dimensionValues[0].value,
    sessions: parseInt(r.metricValues[0].value),
    bounceRate: Math.round(parseFloat(r.metricValues[1].value) * 100),
    avgDuration: Math.round(parseFloat(r.metricValues[2].value)),
  }));

  // ═══ GA4: Device Breakdown ═══
  console.log('Pulling device stats...');
  const devices = await gaReport({
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'bounceRate' }],
  });

  report.devices = (devices.rows || []).map(r => ({
    device: r.dimensionValues[0].value,
    users: parseInt(r.metricValues[0].value),
    sessions: parseInt(r.metricValues[1].value),
    bounceRate: Math.round(parseFloat(r.metricValues[2].value) * 100),
  }));

  // ═══ GA4: Top Cities ═══
  console.log('Pulling top cities...');
  const cities = await gaReport({
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'city' }, { name: 'region' }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 15,
  });

  report.topCities = (cities.rows || []).map(r => ({
    city: r.dimensionValues[0].value,
    region: r.dimensionValues[1].value,
    users: parseInt(r.metricValues[0].value),
    sessions: parseInt(r.metricValues[1].value),
  }));

  // ═══ GSC: Search Performance ═══
  console.log('Pulling GSC data...');
  try {
    const gscResponse = await searchconsole.searchanalytics.query({
      siteUrl: process.env.GSC_SITE_URL,
      requestBody: {
        startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: 25,
      },
    });

    report.topSearchQueries = (gscResponse.data.rows || []).map(r => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Math.round(r.ctr * 10000) / 100,
      position: Math.round(r.position * 10) / 10,
    }));

    // GSC totals
    const gscTotals = await searchconsole.searchanalytics.query({
      siteUrl: process.env.GSC_SITE_URL,
      requestBody: {
        startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
    });

    report.gscTotals = gscTotals.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  } catch (err) {
    console.warn('GSC pull failed:', err.message);
    report.topSearchQueries = [];
    report.gscTotals = { error: err.message };
  }

  // ═══ Save + Print Summary ═══
  const outputPath = path.join(OUTPUT_DIR, 'weekly-digest.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log('\nSaved to:', outputPath);

  // Print human-readable summary
  console.log('\n' + '═'.repeat(60));
  console.log('  WEEKLY DIGEST — Wedding Counselors');
  console.log('  Generated:', now.toLocaleDateString());
  console.log('═'.repeat(60));

  console.log('\n📊 WEEK OVER WEEK');
  console.log('  Users:     ' + weeks.thisWeek.users + ' (' + (deltas.users >= 0 ? '+' : '') + deltas.users + '%)');
  console.log('  Sessions:  ' + weeks.thisWeek.sessions + ' (' + (deltas.sessions >= 0 ? '+' : '') + deltas.sessions + '%)');
  console.log('  PageViews: ' + weeks.thisWeek.pageViews + ' (' + (deltas.pageViews >= 0 ? '+' : '') + deltas.pageViews + '%)');
  console.log('  Bounce:    ' + Math.round(weeks.thisWeek.bounceRate * 100) + '%');

  console.log('\n🔍 GSC TOTALS (7 days)');
  if (report.gscTotals.clicks !== undefined) {
    console.log('  Clicks:      ' + report.gscTotals.clicks);
    console.log('  Impressions: ' + report.gscTotals.impressions);
    console.log('  CTR:         ' + Math.round((report.gscTotals.ctr || 0) * 10000) / 100 + '%');
    console.log('  Avg Position: ' + Math.round((report.gscTotals.position || 0) * 10) / 10);
  }

  console.log('\n🏆 TOP 10 PAGES (views)');
  report.topPages.slice(0, 10).forEach((p, i) => {
    console.log('  ' + (i + 1) + '. ' + p.path + ' — ' + p.views + ' views, ' + p.bounceRate + '% bounce');
  });

  console.log('\n🔎 TOP SEARCH QUERIES');
  (report.topSearchQueries || []).slice(0, 10).forEach((q, i) => {
    console.log('  ' + (i + 1) + '. "' + q.query + '" — ' + q.clicks + ' clicks, ' + q.impressions + ' imp, pos ' + q.position);
  });

  console.log('\n⚡ KEY EVENTS');
  report.events.filter(e => !['web_vitals', 'page_view', 'session_start', 'first_visit'].includes(e.event)).slice(0, 8).forEach(e => {
    console.log('  ' + e.event + ': ' + e.count + ' (' + e.users + ' users)');
  });

  console.log('\n' + '═'.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
