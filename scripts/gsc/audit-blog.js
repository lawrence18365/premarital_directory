/**
 * scripts/gsc/audit-blog.js
 *
 * Comprehensive blog audit using Google Search Console + Indexing APIs.
 *
 * 1. Pulls GSC search performance data filtered to /blog/ URLs
 * 2. Inspects indexing status of all blog posts via URL Inspection API
 * 3. Identifies non-indexed posts and optionally submits them to Indexing API
 *
 * Usage:
 *   node scripts/gsc/audit-blog.js                    # Full audit (positioning + indexing)
 *   node scripts/gsc/audit-blog.js --position-only    # Just GSC positioning data
 *   node scripts/gsc/audit-blog.js --index-only       # Just indexing status check
 *   node scripts/gsc/audit-blog.js --submit           # Audit + submit non-indexed to Indexing API
 *   node scripts/gsc/audit-blog.js --days 90          # Custom date range (default: 28)
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *   GSC_SITE_URL (e.g. sc-domain:weddingcounselors.com)
 */

import 'dotenv/config';
import { google } from 'googleapis';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

const BASE_URL = 'https://www.weddingcounselors.com';
const SITE_URL = process.env.GSC_SITE_URL;

const MISSING = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GSC_SITE_URL']
  .filter(k => !process.env[k]);
if (MISSING.length) {
  console.error('Missing env vars:', MISSING.join(', '));
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const sc = google.webmasters({ version: 'v3', auth: oauth2Client });
const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

const args = process.argv.slice(2);
const POSITION_ONLY = args.includes('--position-only');
const INDEX_ONLY = args.includes('--index-only');
const SUBMIT = args.includes('--submit');
const DAYS_IDX = args.indexOf('--days');
const DAYS = DAYS_IDX !== -1 ? parseInt(args[DAYS_IDX + 1], 10) : 28;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function isoDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// ── Sitemap: get all blog URLs ──────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function getBlogSitemapUrls() {
  const xml = await fetchUrl(`${BASE_URL}/sitemap-blog.xml`);
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  return urls.filter(u => u.includes('/blog/'));
}

// ── 1. GSC Search Performance for Blog URLs ─────────────────────────

async function pullBlogPositioning() {
  const endDate = isoDate(3);
  const startDate = isoDate(DAYS + 3);

  console.log(`\n${'='.repeat(60)}`);
  console.log('  BLOG SEARCH PERFORMANCE (GSC)');
  console.log(`  Date range: ${startDate} → ${endDate} (${DAYS} days)`);
  console.log('='.repeat(60));

  // Page-level data filtered to /blog/
  const pageRes = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      dimensionFilterGroups: [{
        filters: [{ dimension: 'page', operator: 'contains', expression: '/blog/' }]
      }],
      rowLimit: 500,
      dataState: 'all',
    },
  });

  const pageData = (pageRes.data.rows || []).map(r => ({
    page: r.keys[0],
    slug: r.keys[0].replace(`${BASE_URL}/blog/`, ''),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: parseFloat((r.ctr * 100).toFixed(2)),
    position: parseFloat(r.position.toFixed(1)),
  })).sort((a, b) => b.impressions - a.impressions);

  const totalClicks = pageData.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = pageData.reduce((s, r) => s + r.impressions, 0);

  console.log(`\n  Blog totals: ${totalClicks} clicks | ${totalImpressions} impressions`);
  console.log(`  Pages with data: ${pageData.length}\n`);

  if (pageData.length > 0) {
    console.log('  Top Blog Posts by Impressions:');
    console.log('  ' + '-'.repeat(100));
    console.log(`  ${'Slug'.padEnd(55)} ${'Imp'.padStart(7)} ${'Clicks'.padStart(7)} ${'CTR'.padStart(7)} ${'Pos'.padStart(6)}`);
    console.log('  ' + '-'.repeat(100));

    pageData.forEach(r => {
      const slug = r.slug.length > 52 ? r.slug.substring(0, 49) + '...' : r.slug;
      console.log(`  ${slug.padEnd(55)} ${String(r.impressions).padStart(7)} ${String(r.clicks).padStart(7)} ${(r.ctr + '%').padStart(7)} ${String(r.position).padStart(6)}`);
    });
  }

  // Query-level data for blog pages (what queries are people searching)
  const queryRes = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      dimensionFilterGroups: [{
        filters: [{ dimension: 'page', operator: 'contains', expression: '/blog/' }]
      }],
      rowLimit: 200,
      dataState: 'all',
    },
  });

  const queryData = (queryRes.data.rows || []).map(r => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: parseFloat((r.ctr * 100).toFixed(2)),
    position: parseFloat(r.position.toFixed(1)),
  })).sort((a, b) => b.impressions - a.impressions);

  if (queryData.length > 0) {
    console.log('\n  Top Blog Queries:');
    console.log('  ' + '-'.repeat(100));
    console.log(`  ${'Query'.padEnd(55)} ${'Imp'.padStart(7)} ${'Clicks'.padStart(7)} ${'CTR'.padStart(7)} ${'Pos'.padStart(6)}`);
    console.log('  ' + '-'.repeat(100));

    queryData.slice(0, 30).forEach(r => {
      const q = r.query.length > 52 ? r.query.substring(0, 49) + '...' : r.query;
      console.log(`  ${q.padEnd(55)} ${String(r.impressions).padStart(7)} ${String(r.clicks).padStart(7)} ${(r.ctr + '%').padStart(7)} ${String(r.position).padStart(6)}`);
    });
  }

  // Near-win opportunities (position 4-20, high impressions)
  const nearWins = queryData
    .filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 3)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  if (nearWins.length > 0) {
    console.log('\n  Near-Win Opportunities (pos 4-20, 3+ imp):');
    console.log('  ' + '-'.repeat(80));
    nearWins.forEach(r => {
      console.log(`  [pos ${String(r.position).padStart(4)}] ${r.query.padEnd(50)} ${r.impressions} imp / ${r.clicks} clicks`);
    });
  }

  // Query + page combined for blog
  const combinedRes = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      dimensionFilterGroups: [{
        filters: [{ dimension: 'page', operator: 'contains', expression: '/blog/' }]
      }],
      rowLimit: 1000,
      dataState: 'all',
    },
  });

  const combinedData = (combinedRes.data.rows || []).map(r => ({
    query: r.keys[0],
    page: r.keys[1],
    slug: r.keys[1].replace(`${BASE_URL}/blog/`, ''),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: parseFloat((r.ctr * 100).toFixed(2)),
    position: parseFloat(r.position.toFixed(1)),
  }));

  // Save all data
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().split('T')[0];

  const report = {
    timestamp: new Date().toISOString(),
    dateRange: { start: startDate, end: endDate, days: DAYS },
    totals: { clicks: totalClicks, impressions: totalImpressions },
    pages: pageData,
    queries: queryData,
    combined: combinedData,
    nearWins,
  };

  const reportPath = path.join(OUTPUT_DIR, `blog-performance-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  Report saved: ${reportPath}`);

  return { pageData, queryData };
}

// ── 2. URL Inspection for Blog Posts ────────────────────────────────

async function checkBlogIndexing() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('  BLOG INDEXING STATUS (URL Inspection API)');
  console.log('='.repeat(60));

  console.log('\n  Fetching blog URLs from sitemap...');
  const blogUrls = await getBlogSitemapUrls();
  console.log(`  Found ${blogUrls.length} blog URLs in sitemap\n`);

  if (blogUrls.length === 0) {
    console.log('  No blog URLs found in sitemap-blog.xml');
    return { indexed: [], notIndexed: [], errors: [] };
  }

  const results = [];
  for (let i = 0; i < blogUrls.length; i++) {
    const url = blogUrls[i];
    const slug = url.replace(`${BASE_URL}/blog/`, '');

    try {
      const res = await searchconsole.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl: SITE_URL }
      });

      const idx = res.data.inspectionResult.indexStatusResult;
      const mobile = res.data.inspectionResult.mobileUsabilityResult;
      const rich = res.data.inspectionResult.richResultsResult;

      results.push({
        url,
        slug,
        verdict: idx.verdict,
        coverageState: idx.coverageState,
        lastCrawlTime: idx.lastCrawlTime || null,
        pageFetchState: idx.pageFetchState || null,
        crawledAs: idx.crawledAs || null,
        robotsTxtState: idx.robotsTxtState || null,
        mobileVerdict: mobile?.verdict || null,
        richVerdict: rich?.verdict || null,
        richTypes: rich?.detectedItems?.map(i => i.richResultType) || [],
      });

      const icon = idx.verdict === 'PASS' ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      const crawlDate = idx.lastCrawlTime ? new Date(idx.lastCrawlTime).toLocaleDateString() : 'never';
      process.stdout.write(`  ${icon} [${i + 1}/${blogUrls.length}] ${slug.padEnd(55)} ${idx.verdict.padEnd(12)} crawled: ${crawlDate}\n`);
    } catch (e) {
      results.push({
        url, slug, verdict: 'ERROR', coverageState: e.message?.substring(0, 60) || 'Unknown',
      });
      process.stdout.write(`  \x1b[33m!\x1b[0m [${i + 1}/${blogUrls.length}] ${slug.padEnd(55)} ERROR\n`);
    }

    // Rate limit: ~1 req/sec
    if (i < blogUrls.length - 1) await sleep(1200);
  }

  const indexed = results.filter(r => r.verdict === 'PASS');
  const notIndexed = results.filter(r => r.verdict !== 'PASS' && r.verdict !== 'ERROR');
  const errors = results.filter(r => r.verdict === 'ERROR');

  console.log(`\n  ${'─'.repeat(50)}`);
  console.log(`  INDEXING SUMMARY`);
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  Total blog posts:   ${results.length}`);
  console.log(`  Indexed (PASS):     \x1b[32m${indexed.length}\x1b[0m (${Math.round(indexed.length / results.length * 100)}%)`);
  console.log(`  Not indexed:        \x1b[31m${notIndexed.length}\x1b[0m (${Math.round(notIndexed.length / results.length * 100)}%)`);
  console.log(`  API errors:         ${errors.length}`);

  if (notIndexed.length > 0) {
    console.log(`\n  Non-Indexed Blog Posts:`);
    notIndexed.forEach(r => {
      console.log(`    ✗ ${r.slug} — ${r.coverageState}`);
    });
  }

  // Rich results breakdown
  const withRich = indexed.filter(r => r.richTypes && r.richTypes.length > 0);
  if (withRich.length > 0) {
    console.log(`\n  Rich Results detected: ${withRich.length}/${indexed.length} indexed posts`);
    const richCounts = {};
    withRich.forEach(r => r.richTypes.forEach(t => richCounts[t] = (richCounts[t] || 0) + 1));
    Object.entries(richCounts).forEach(([type, count]) => {
      console.log(`    ${type}: ${count} posts`);
    });
  }

  // Crawl freshness
  const crawlTimes = indexed
    .filter(r => r.lastCrawlTime)
    .map(r => new Date(r.lastCrawlTime).getTime());
  if (crawlTimes.length > 0) {
    const oldestCrawl = new Date(Math.min(...crawlTimes));
    const newestCrawl = new Date(Math.max(...crawlTimes));
    const avgAge = Math.round((Date.now() - crawlTimes.reduce((a, b) => a + b, 0) / crawlTimes.length) / (1000 * 60 * 60 * 24));
    console.log(`\n  Crawl Freshness:`);
    console.log(`    Most recent crawl:  ${newestCrawl.toLocaleDateString()}`);
    console.log(`    Oldest crawl:       ${oldestCrawl.toLocaleDateString()}`);
    console.log(`    Average crawl age:  ${avgAge} days`);
  }

  // Save results
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(OUTPUT_DIR, `blog-indexing-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: results.length,
    indexed: indexed.length,
    notIndexed: notIndexed.length,
    errors: errors.length,
    results,
  }, null, 2));
  console.log(`\n  Report saved: ${reportPath}`);

  return { indexed, notIndexed, errors, allResults: results };
}

// ── 3. Submit non-indexed to Indexing API ───────────────────────────

async function submitToIndexingApi(urls) {
  if (urls.length === 0) {
    console.log('\n  No URLs to submit.');
    return;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('  SUBMITTING TO GOOGLE INDEXING API');
  console.log('='.repeat(60));
  console.log(`\n  Submitting ${urls.length} non-indexed blog URLs...\n`);

  const { token } = await oauth2Client.getAccessToken();
  let ok = 0;
  let fail = 0;

  for (const url of urls) {
    const slug = url.replace(`${BASE_URL}/blog/`, '');

    try {
      const result = await new Promise((resolve) => {
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
        req.write(body);
        req.end();
      });

      if (result.ok) {
        ok++;
        console.log(`  \x1b[32m✓\x1b[0m ${slug}`);
      } else if (result.status === 429) {
        fail++;
        console.log(`  \x1b[33m⏳\x1b[0m ${slug} (rate limited)`);
      } else {
        fail++;
        console.log(`  \x1b[31m✗\x1b[0m ${slug} (${result.status})`);
      }
    } catch (e) {
      fail++;
      console.log(`  \x1b[31m✗\x1b[0m ${slug} (${e.message})`);
    }

    await sleep(1500);
  }

  console.log(`\n  Done: ${ok} submitted, ${fail} failed`);
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  BLOG SEO AUDIT — weddingcounselors.com');
  console.log('═'.repeat(60));

  let positioningData = null;
  let indexingData = null;

  // 1. GSC Search Performance
  if (!INDEX_ONLY) {
    positioningData = await pullBlogPositioning();
  }

  // 2. Indexing Status
  if (!POSITION_ONLY) {
    indexingData = await checkBlogIndexing();
  }

  // 3. Cross-reference: find posts in sitemap with no GSC impressions
  if (positioningData && indexingData) {
    const pagesWithData = new Set(positioningData.pageData.map(p => p.page));
    const indexedUrls = indexingData.indexed.map(r => r.url);
    const indexedNoTraffic = indexedUrls.filter(u => !pagesWithData.has(u));

    if (indexedNoTraffic.length > 0) {
      console.log(`\n${'='.repeat(60)}`);
      console.log('  INDEXED BUT ZERO IMPRESSIONS');
      console.log('='.repeat(60));
      console.log(`\n  These ${indexedNoTraffic.length} posts are indexed but got 0 impressions in the last ${DAYS} days:`);
      indexedNoTraffic.forEach(u => {
        console.log(`    ${u.replace(`${BASE_URL}/blog/`, '')}`);
      });
      console.log('\n  Consider: updating content, improving title/meta, or building internal links.');
    }
  }

  // 4. Submit non-indexed if --submit flag
  if (SUBMIT && indexingData && indexingData.notIndexed.length > 0) {
    await submitToIndexingApi(indexingData.notIndexed.map(r => r.url));
  } else if (SUBMIT && indexingData && indexingData.notIndexed.length === 0) {
    console.log('\n  All blog posts are indexed — nothing to submit.');
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  AUDIT COMPLETE');
  console.log('═'.repeat(60) + '\n');
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  if (e.code === 401 || e.message?.includes('invalid_grant')) {
    console.error('Auth expired — re-run: node scripts/gsc/auth.js');
  }
  process.exit(1);
});
