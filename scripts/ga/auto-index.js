/**
 * scripts/ga/auto-index.js
 *
 * Submits URLs to Google's Indexing API for fast crawling.
 * Logs all submissions to Supabase `indexing_submissions` table for
 * dedup (48h window) and daily quota tracking.
 *
 * Usage:
 *   node scripts/ga/auto-index.js                    # Submit all important pages
 *   node scripts/ga/auto-index.js --url <url>        # Submit a single URL
 *   node scripts/ga/auto-index.js --sitemap          # Parse sitemap and submit all URLs
 *   node scripts/ga/auto-index.js --new-profiles     # Submit recently created/claimed profiles
 *   node scripts/ga/auto-index.js --priority         # Submit top non-indexed URLs from coverage report
 *   node scripts/ga/auto-index.js --from-file <path> # Submit URLs from a text file (one per line)
 *   node scripts/ga/auto-index.js --dry-run          # Show what would be submitted without calling API
 *
 * Daily limit: 200 URLs/day (Google quota)
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import fs from 'fs';
import path from 'path';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const BASE_URL = 'https://www.weddingcounselors.com';
const DAILY_LIMIT = 200;
const DEDUP_HOURS = 48;

const supabase = createClient(
  'https://bkjwctlolhoxhnoospwp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// ── Dedup & Quota ───────────────────────────────────────────────────

async function getRecentlySubmitted() {
  const since = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('indexing_submissions')
    .select('url')
    .gte('submitted_at', since)
    .eq('status_code', 200);

  if (error) {
    // Table might not exist yet — gracefully degrade
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      console.log('  (indexing_submissions table not found — skipping dedup)\n');
      return new Set();
    }
    console.warn('  Warning: could not check recent submissions:', error.message);
    return new Set();
  }
  return new Set((data || []).map(r => r.url));
}

async function getTodayQuotaUsed() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('indexing_submissions')
    .select('id', { count: 'exact', head: true })
    .gte('submitted_at', todayStart.toISOString())
    .eq('status_code', 200);

  if (error) return 0;
  return count || 0;
}

async function logSubmission(url, statusCode, response, source) {
  await supabase
    .from('indexing_submissions')
    .insert({ url, status_code: statusCode, response, source })
    .then(() => {})  // fire and forget
    .catch(() => {}); // ignore errors
}

// ── Dedup filter ────────────────────────────────────────────────────

async function dedup(urls, source) {
  const recentlySubmitted = await getRecentlySubmitted();
  const quotaUsed = await getTodayQuotaUsed();
  const quotaRemaining = Math.max(0, DAILY_LIMIT - quotaUsed);

  const fresh = urls.filter(u => !recentlySubmitted.has(u));
  const skipped = urls.length - fresh.length;

  if (skipped > 0) {
    console.log(`  Dedup: ${skipped} URLs submitted within ${DEDUP_HOURS}h — skipping`);
  }
  console.log(`  Quota: ${quotaUsed}/${DAILY_LIMIT} used today, ${quotaRemaining} remaining`);

  if (fresh.length === 0) {
    console.log('  All URLs already submitted recently. Nothing to do.\n');
    return [];
  }

  const limited = fresh.slice(0, quotaRemaining);
  if (limited.length < fresh.length) {
    console.log(`  Capping to ${limited.length} URLs (quota remaining)`);
  }

  return limited;
}

// ── Indexing API ────────────────────────────────────────────────────

async function getAccessToken() {
  const { token } = await oauth2Client.getAccessToken();
  return token;
}

async function submitUrl(token, url) {
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
      res.on('end', () => resolve({ url, status: res.statusCode, ok: res.statusCode === 200, response: d }));
    });
    req.write(body);
    req.end();
  });
}

async function batchSubmit(urls, source = 'manual') {
  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would submit ${urls.length} URLs:\n`);
    urls.slice(0, 20).forEach(u => console.log(`  ${u}`));
    if (urls.length > 20) console.log(`  ... and ${urls.length - 20} more`);
    return { ok: 0, fail: 0, skipped: 0 };
  }

  const filtered = await dedup(urls, source);
  if (filtered.length === 0) return { ok: 0, fail: 0, skipped: urls.length };

  const token = await getAccessToken();
  console.log(`\nSubmitting ${filtered.length} URLs...\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < filtered.length; i += 3) {
    const batch = filtered.slice(i, i + 3);
    const results = await Promise.all(batch.map(url => submitUrl(token, url)));

    for (const r of results) {
      if (r.ok) {
        ok++;
        console.log(`  ✓ ${r.url}`);
      } else if (r.status === 429) {
        fail++;
        console.log(`  ⏳ ${r.url} (rate limited — will retry next run)`);
      } else {
        fail++;
        console.log(`  ✗ ${r.url} (${r.status})`);
      }
      // Log to Supabase (only log successful ones for dedup)
      if (r.ok) {
        await logSubmission(r.url, r.status, r.response, source);
      }
    }

    // 1.5s between batches to stay under rate limits
    if (i + 3 < filtered.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\nDone: ${ok} submitted, ${fail} failed, ${urls.length - filtered.length} deduped`);
  return { ok, fail, skipped: urls.length - filtered.length };
}

// ── Modes ───────────────────────────────────────────────────────────

async function submitSingleUrl(url) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would submit: ${url}`);
    return;
  }
  const token = await getAccessToken();
  const result = await submitUrl(token, url);
  console.log(result.ok ? `✓ Submitted: ${url}` : `✗ Failed: ${url} (${result.status})`);
  await logSubmission(result.url, result.status, result.response, 'manual-single');
}

async function submitNewProfiles() {
  console.log('\n=== Submitting New/Claimed Profiles (last 24h) ===\n');

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('slug, city, state_province')
    .or(`created_at.gte.${since},claimed_at.gte.${since}`)
    .eq('is_hidden', false)
    .in('moderation_status', ['approved', null]);

  if (error) {
    console.error('Supabase error:', error.message);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No new/claimed profiles in the last 24 hours.');
    return;
  }

  const urls = profiles
    .filter(p => p.slug)
    .map(p => {
      const stateSlug = (p.state_province || '').toLowerCase().replace(/\s+/g, '-');
      const citySlug = (p.city || '').toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
      return `${BASE_URL}/premarital-counseling/${stateSlug}/${citySlug}/${p.slug}`;
    });

  console.log(`Found ${urls.length} new/claimed profiles`);
  await batchSubmit(urls, 'cron-new-profiles');
}

async function submitImportantPages() {
  console.log('\n=== Submitting Important Pages ===\n');

  const staticPages = [
    `${BASE_URL}/`,
    `${BASE_URL}/premarital-counseling`,
    `${BASE_URL}/premarital-counseling/marriage-license-discount`,
    `${BASE_URL}/premarital-counseling/christian`,
    `${BASE_URL}/premarital-counseling/catholic`,
    `${BASE_URL}/premarital-counseling/gottman`,
    `${BASE_URL}/premarital-counseling/lgbtq`,
    `${BASE_URL}/premarital-counseling/affordable`,
  ];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('city, state_province')
    .eq('is_hidden', false)
    .in('moderation_status', ['approved', null])
    .not('city', 'is', null);

  const citySet = new Set();
  const stateSet = new Set();
  (profiles || []).forEach(p => {
    if (p.state_province) {
      const stateSlug = p.state_province.toLowerCase().replace(/\s+/g, '-');
      stateSet.add(stateSlug);
      if (p.city) {
        const citySlug = p.city.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
        citySet.add(`${stateSlug}/${citySlug}`);
      }
    }
  });

  const stateUrls = [...stateSet].map(s => `${BASE_URL}/premarital-counseling/${s}`);
  const cityUrls = [...citySet].slice(0, 100).map(c => `${BASE_URL}/premarital-counseling/${c}`);

  const allUrls = [...staticPages, ...stateUrls, ...cityUrls];
  console.log(`Collected ${allUrls.length} URLs (${staticPages.length} static, ${stateUrls.length} states, ${cityUrls.length} cities)`);

  await batchSubmit(allUrls, 'manual');
}

function fetchSitemapUrls(sitemapUrl) {
  return new Promise((resolve) => {
    https.get(sitemapUrl, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        // Check if it's a sitemap index
        const sitemapRefs = [...data.matchAll(/<sitemap>\s*<loc>(.*?)<\/loc>/gs)].map(m => m[1]);
        if (sitemapRefs.length > 0) {
          // It's a sitemap index — fetch each sub-sitemap
          Promise.all(sitemapRefs.map(ref => fetchSitemapUrls(ref))).then(results => {
            resolve(results.flat());
          });
        } else {
          const urls = [...data.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
          resolve(urls);
        }
      });
    }).on('error', () => resolve([]));
  });
}

async function submitFromSitemap() {
  console.log('\n=== Submitting All Sitemap URLs ===\n');

  const urls = await fetchSitemapUrls(`${BASE_URL}/sitemap.xml`);
  console.log(`Found ${urls.length} URLs across all sitemaps`);
  await batchSubmit(urls, 'cron-sitemap');
}

async function submitPriority() {
  console.log('\n=== Submitting Priority Non-Indexed URLs ===\n');

  // Look for the latest coverage report
  const outputDir = path.join(import.meta.dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    console.error('No output directory found. Run index-coverage-report.js first.');
    return;
  }

  const nonIndexedFiles = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('non-indexed-urls-'))
    .sort()
    .reverse();

  if (nonIndexedFiles.length === 0) {
    console.error('No non-indexed URL file found. Run index-coverage-report.js first.');
    return;
  }

  const filePath = path.join(outputDir, nonIndexedFiles[0]);
  console.log(`Using: ${nonIndexedFiles[0]}`);

  const urls = fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map(u => u.trim())
    .filter(Boolean);

  // Prioritize: city pages first, then profiles
  const prioritized = urls.sort((a, b) => {
    const aParts = a.split('/').length;
    const bParts = b.split('/').length;
    // Fewer path segments = higher priority (city before profile)
    return aParts - bParts;
  });

  console.log(`Loaded ${prioritized.length} non-indexed URLs`);
  await batchSubmit(prioritized, 'cron-priority');
}

async function submitFromFile(filePath) {
  console.log(`\n=== Submitting URLs from ${filePath} ===\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const urls = fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map(u => u.trim())
    .filter(Boolean);

  console.log(`Loaded ${urls.length} URLs from file`);
  await batchSubmit(urls, 'manual-file');
}

// ── CLI ─────────────────────────────────────────────────────────────

if (args.includes('--url')) {
  const url = args[args.indexOf('--url') + 1];
  if (!url) { console.error('Usage: --url <url>'); process.exit(1); }
  submitSingleUrl(url);
} else if (args.includes('--sitemap')) {
  submitFromSitemap();
} else if (args.includes('--new-profiles')) {
  submitNewProfiles();
} else if (args.includes('--priority')) {
  submitPriority();
} else if (args.includes('--from-file')) {
  const fp = args[args.indexOf('--from-file') + 1];
  if (!fp) { console.error('Usage: --from-file <path>'); process.exit(1); }
  submitFromFile(fp);
} else {
  submitImportantPages();
}
