/**
 * scripts/ga/index-coverage-report.js
 *
 * Pulls index coverage status for all sitemap URLs using Google's
 * URL Inspection API. Outputs a report showing indexed vs non-indexed
 * breakdown by page type and coverage state.
 *
 * Rate limit: URL Inspection API allows ~2,000 requests/day and
 * recommends max 1 request/second.
 *
 * Usage:
 *   node scripts/ga/index-coverage-report.js              # Check all sitemap URLs
 *   node scripts/ga/index-coverage-report.js --sample 50  # Random sample of N
 *   node scripts/ga/index-coverage-report.js --profiles    # Profiles only
 */

import 'dotenv/config';
import { google } from 'googleapis';
import https from 'https';
import fs from 'fs';
import path from 'path';

const SITE_URL = 'sc-domain:weddingcounselors.com';
const BASE = 'https://www.weddingcounselors.com';
const OUTPUT_DIR = path.join(import.meta.dirname, 'output');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

// ── Fetch sitemap URLs ──────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function categorizeUrl(url) {
  const p = url.replace(BASE, '');
  const parts = p.split('/').filter(Boolean);
  if (parts.length === 0) return 'homepage';
  if (parts[0] === 'blog') return 'blog';
  if (parts[0] !== 'premarital-counseling') return 'other';
  if (parts.length === 1) return 'index';
  if (parts.length === 2) return 'state';
  if (parts.length === 3) return 'city';
  if (parts.length === 4) return 'profile';
  return 'other';
}

async function getAllSitemapUrls(profilesOnly = false) {
  const sitemaps = profilesOnly
    ? [`${BASE}/sitemap-profiles.xml`]
    : [
        `${BASE}/sitemap-core.xml`,
        `${BASE}/sitemap-cities.xml`,
        `${BASE}/sitemap-specialties.xml`,
        `${BASE}/sitemap-blog.xml`,
        `${BASE}/sitemap-profiles.xml`,
      ];

  const urls = [];
  for (const sm of sitemaps) {
    const xml = await fetchUrl(sm);
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    urls.push(...matches);
    console.log(`  ${sm.split('/').pop()}: ${matches.length} URLs`);
  }
  return urls;
}

// ── URL Inspection ──────────────────────────────────────────────────

async function inspectUrl(url) {
  try {
    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: url,
        siteUrl: SITE_URL,
      }
    });

    const idx = res.data.inspectionResult.indexStatusResult;
    return {
      url,
      verdict: idx.verdict,
      coverageState: idx.coverageState,
      crawledAs: idx.crawledAs || null,
      lastCrawlTime: idx.lastCrawlTime || null,
      indexingState: idx.indexingState || null,
      robotsTxtState: idx.robotsTxtState || null,
      pageFetchState: idx.pageFetchState || null,
      category: categorizeUrl(url),
    };
  } catch (e) {
    return {
      url,
      verdict: 'ERROR',
      coverageState: e.message?.substring(0, 80) || 'Unknown error',
      category: categorizeUrl(url),
    };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const profilesOnly = args.includes('--profiles');
  const sampleIdx = args.indexOf('--sample');
  const sampleSize = sampleIdx !== -1 ? parseInt(args[sampleIdx + 1], 10) : null;

  console.log('\n=== Google Index Coverage Report ===\n');
  console.log('Fetching sitemap URLs...');
  let urls = await getAllSitemapUrls(profilesOnly);

  if (sampleSize && sampleSize < urls.length) {
    // Stratified sample: ensure we get some from each category
    const byCategory = {};
    urls.forEach(u => {
      const cat = categorizeUrl(u);
      (byCategory[cat] = byCategory[cat] || []).push(u);
    });

    const sampled = [];
    const catKeys = Object.keys(byCategory);
    const perCat = Math.max(2, Math.floor(sampleSize / catKeys.length));

    for (const cat of catKeys) {
      const pool = byCategory[cat];
      const n = Math.min(perCat, pool.length);
      // Shuffle and take n
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      sampled.push(...pool.slice(0, n));
    }

    // Fill remaining quota randomly
    const remaining = urls.filter(u => !sampled.includes(u));
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    while (sampled.length < sampleSize && remaining.length > 0) {
      sampled.push(remaining.pop());
    }

    urls = sampled;
    console.log(`\nSampling ${urls.length} URLs (stratified by category)`);
  }

  console.log(`\nInspecting ${urls.length} URLs (rate: 1/sec)...\n`);

  const results = [];
  let inspected = 0;

  for (const url of urls) {
    const result = await inspectUrl(url);
    results.push(result);
    inspected++;

    const slug = url.replace(BASE, '') || '/';
    const icon = result.verdict === 'PASS' ? '✓' : result.verdict === 'ERROR' ? '!' : '✗';
    process.stdout.write(`\r  ${inspected}/${urls.length} — ${icon} ${slug.substring(0, 70).padEnd(70)}`);

    // Rate limit: 1 request per 1.2 seconds to stay safe
    if (inspected < urls.length) await sleep(1200);
  }

  process.stdout.write('\n\n');

  // ── Aggregation ─────────────────────────────────────────────────

  const indexed = results.filter(r => r.verdict === 'PASS');
  const notIndexed = results.filter(r => r.verdict !== 'PASS' && r.verdict !== 'ERROR');
  const errors = results.filter(r => r.verdict === 'ERROR');

  console.log('=== Summary ===');
  console.log(`  Total checked:  ${results.length}`);
  console.log(`  Indexed:        ${indexed.length} (${Math.round(indexed.length / results.length * 100)}%)`);
  console.log(`  Not indexed:    ${notIndexed.length} (${Math.round(notIndexed.length / results.length * 100)}%)`);
  console.log(`  Errors:         ${errors.length}`);

  // By category
  console.log('\n=== By Page Type ===');
  const categories = {};
  results.forEach(r => {
    const cat = r.category;
    if (!categories[cat]) categories[cat] = { total: 0, indexed: 0, notIndexed: 0, errors: 0 };
    categories[cat].total++;
    if (r.verdict === 'PASS') categories[cat].indexed++;
    else if (r.verdict === 'ERROR') categories[cat].errors++;
    else categories[cat].notIndexed++;
  });

  Object.entries(categories)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, d]) => {
      const pct = d.total > 0 ? Math.round(d.indexed / d.total * 100) : 0;
      console.log(`  ${cat.padEnd(12)} ${String(d.indexed).padStart(4)}/${String(d.total).padStart(4)} indexed (${pct}%) — ${d.notIndexed} not indexed`);
    });

  // Coverage state breakdown for non-indexed
  console.log('\n=== Non-Indexed Reasons ===');
  const reasons = {};
  notIndexed.forEach(r => {
    const reason = r.coverageState || 'Unknown';
    reasons[reason] = (reasons[reason] || 0) + 1;
  });
  Object.entries(reasons)
    .sort((a, b) => b[1] - a[1])
    .forEach(([reason, count]) => {
      console.log(`  ${count.toString().padStart(4)}  ${reason}`);
    });

  // ── Save detailed results ───────────────────────────────────────

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(OUTPUT_DIR, `coverage-report-${timestamp}.json`);

  const report = {
    timestamp: new Date().toISOString(),
    totalChecked: results.length,
    indexed: indexed.length,
    notIndexed: notIndexed.length,
    errors: errors.length,
    byCategory: categories,
    byReason: reasons,
    results: results.map(r => ({
      url: r.url,
      category: r.category,
      verdict: r.verdict,
      coverageState: r.coverageState,
      lastCrawlTime: r.lastCrawlTime,
      crawledAs: r.crawledAs,
    })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);

  // Save non-indexed URLs as a flat list for the indexing script
  const nonIndexedPath = path.join(OUTPUT_DIR, `non-indexed-urls-${timestamp}.txt`);
  fs.writeFileSync(nonIndexedPath, notIndexed.map(r => r.url).join('\n'));
  console.log(`Non-indexed URL list saved to: ${nonIndexedPath}`);

  console.log('\n=== Done ===\n');
}

main().catch(e => { console.error(e); process.exit(1); });
