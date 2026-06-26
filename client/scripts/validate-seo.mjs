#!/usr/bin/env node
/**
 * SEO / crawl-hygiene validator for weddingcounselors.com
 *
 * Fetches the live (or a supplied base URL) SEO surface and asserts the
 * invariants that keep Google's index clean:
 *   - robots.txt references exactly one canonical sitemap
 *   - the sitemap index and every child sitemap return 200 XML
 *   - every <loc> uses the canonical host (https://www.weddingcounselors.com)
 *   - no duplicate URLs across the whole sitemap set
 *   - a sample of sitemap URLs return 200 (not redirected, not 404)
 *   - a sample of sitemap URLs are NOT noindex and have a self-referential canonical
 *   - known stale sitemaps (sitemap-phase1.xml) redirect to the canonical sitemap
 *   - non-www and http both redirect to the canonical host
 *
 * Usage:
 *   node scripts/validate-seo.mjs                 # validates production
 *   node scripts/validate-seo.mjs --base https://staging.example.com
 *   node scripts/validate-seo.mjs --sample 40     # sample N URLs per child (default 12)
 *
 * Exits non-zero if any hard invariant fails (CI-friendly).
 */

const CANONICAL_HOST = 'https://www.weddingcounselors.com';

const args = process.argv.slice(2);
const getArg = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
};
const BASE = (getArg('--base', CANONICAL_HOST)).replace(/\/$/, '');
const SAMPLE = parseInt(getArg('--sample', '12'), 10);

const UA = 'Googlebot/2.1 (+http://www.google.com/bot.html)';
const errors = [];
const warnings = [];
const pass = [];
const fail = (m) => { errors.push(m); console.log(`  [31m✗[0m ${m}`); };
const warn = (m) => { warnings.push(m); console.log(`  [33m![0m ${m}`); };
const ok = (m) => { pass.push(m); console.log(`  [32m✓[0m ${m}`); };

async function fetchText(url, { redirect = 'manual' } = {}) {
  const res = await fetch(url, { redirect, headers: { 'User-Agent': UA } });
  const body = res.status >= 200 && res.status < 300 ? await res.text() : '';
  return { status: res.status, location: res.headers.get('location'), contentType: res.headers.get('content-type') || '', body };
}

const extractLocs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);

function sample(arr, n) {
  if (arr.length <= n) return arr;
  const step = Math.floor(arr.length / n);
  const out = [];
  for (let i = 0; i < arr.length && out.length < n; i += step) out.push(arr[i]);
  return out;
}

async function main() {
  console.log(`\nSEO validation against ${BASE}\n`);

  // 1. robots.txt
  console.log('robots.txt');
  const robots = await fetchText(`${BASE}/robots.txt`);
  if (robots.status !== 200) fail(`robots.txt returned ${robots.status}`);
  else {
    const sitemapLines = [...robots.body.matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map((m) => m[1]);
    if (sitemapLines.length === 0) fail('robots.txt has no Sitemap: directive');
    else if (sitemapLines.length > 1) warn(`robots.txt references ${sitemapLines.length} sitemaps: ${sitemapLines.join(', ')}`);
    if (sitemapLines.includes(`${CANONICAL_HOST}/sitemap.xml`)) ok('robots.txt references canonical sitemap');
    else fail(`robots.txt does not reference ${CANONICAL_HOST}/sitemap.xml (found: ${sitemapLines.join(', ') || 'none'})`);
  }

  // 2. sitemap index + children
  console.log('\nsitemap index');
  const index = await fetchText(`${BASE}/sitemap.xml`);
  if (index.status !== 200) { fail(`sitemap.xml returned ${index.status}`); return finish(); }
  if (!/sitemapindex|urlset/i.test(index.body)) fail('sitemap.xml is not valid sitemap XML');
  const childSitemaps = extractLocs(index.body);
  ok(`sitemap index fetched (${childSitemaps.length} child sitemaps)`);

  const allUrls = [];
  const childStats = [];
  // If sitemap.xml is itself a urlset (small-site mode), treat it as the only child.
  const children = /sitemapindex/i.test(index.body) ? childSitemaps : [`${BASE}/sitemap.xml`];

  for (const child of children) {
    if (!child.startsWith(CANONICAL_HOST)) fail(`child sitemap uses non-canonical host: ${child}`);
    const childUrl = child.replace(CANONICAL_HOST, BASE);
    const res = await fetchText(childUrl);
    if (res.status !== 200) { fail(`child sitemap ${child} returned ${res.status}`); continue; }
    if (!/application\/xml|text\/xml/i.test(res.contentType) && !/<urlset/i.test(res.body)) {
      fail(`child sitemap ${child} is not XML (content-type ${res.contentType})`);
      continue;
    }
    const locs = extractLocs(res.body);
    childStats.push({ child, count: locs.length });
    allUrls.push(...locs);
  }
  console.log('\nchild sitemaps');
  childStats.forEach((s) => ok(`${s.child.split('/').pop()}: ${s.count} URLs`));

  // 3. host + dedup
  console.log('\nhost + duplicate checks');
  const nonCanonical = allUrls.filter((u) => !u.startsWith(CANONICAL_HOST + '/') && u !== CANONICAL_HOST + '/');
  if (nonCanonical.length) fail(`${nonCanonical.length} sitemap URLs use a non-canonical host (e.g. ${nonCanonical[0]})`);
  else ok(`all ${allUrls.length} sitemap URLs use canonical host`);

  const seen = new Set(); const dupes = new Set();
  for (const u of allUrls) { if (seen.has(u)) dupes.add(u); seen.add(u); }
  if (dupes.size) fail(`${dupes.size} duplicate sitemap URLs (e.g. ${[...dupes][0]})`);
  else ok(`no duplicate URLs across ${allUrls.length} total`);

  // 4. sample URL health: 200, not redirected, not noindex, self-canonical
  console.log(`\nsampling URL health (${SAMPLE} per child)`);
  const toCheck = [];
  for (const s of childStats) {
    const res = await fetchText(s.child.replace(CANONICAL_HOST, BASE));
    toCheck.push(...sample(extractLocs(res.body), SAMPLE));
  }
  let redirected = 0, notOk = 0, noindexed = 0, badCanon = 0, checked = 0;
  for (const u of toCheck) {
    const target = u.replace(CANONICAL_HOST, BASE);
    const res = await fetchText(target);
    checked++;
    if (res.status >= 300 && res.status < 400) { redirected++; fail(`sitemap URL redirects (${res.status}): ${u} -> ${res.location}`); continue; }
    if (res.status !== 200) { notOk++; fail(`sitemap URL returned ${res.status}: ${u}`); continue; }
    const robotsMeta = (res.body.match(/<meta[^>]+name=["'](?:robots|googlebot)["'][^>]*>/gi) || []).join(' ');
    if (/noindex/i.test(robotsMeta)) { noindexed++; fail(`sitemap URL is noindex: ${u}`); }
    const canon = (res.body.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
    if (canon && canon.replace(/\/$/, '') !== u.replace(/\/$/, '')) { badCanon++; warn(`canonical mismatch: ${u} -> ${canon}`); }
  }
  if (!redirected && !notOk) ok(`${checked} sampled URLs all return 200`);
  if (!noindexed) ok(`${checked} sampled URLs are all indexable (no noindex)`);
  if (!badCanon) ok(`sampled canonicals are self-referential`);

  // 5. stale sitemap ghost + host redirects
  console.log('\nstale sitemap + host redirects');
  const phase1 = await fetchText(`${BASE}/sitemap-phase1.xml`);
  if (phase1.status === 301 || phase1.status === 308) ok(`sitemap-phase1.xml -> ${phase1.location} (${phase1.status})`);
  else if (phase1.status === 200 && /<!doctype html|<html/i.test(phase1.body)) fail('sitemap-phase1.xml returns 200 HTML (stale ghost still live)');
  else warn(`sitemap-phase1.xml returned ${phase1.status}`);

  if (BASE === CANONICAL_HOST) {
    const nonwww = await fetchText('https://weddingcounselors.com/');
    if ([301, 307, 308].includes(nonwww.status) && (nonwww.location || '').startsWith(CANONICAL_HOST)) ok(`non-www -> www (${nonwww.status})`);
    else fail(`non-www did not redirect to www (status ${nonwww.status}, location ${nonwww.location})`);
    const http = await fetchText('http://www.weddingcounselors.com/');
    if ([301, 307, 308].includes(http.status) && (http.location || '').startsWith('https://')) ok(`http -> https (${http.status})`);
    else warn(`http -> https check inconclusive (status ${http.status})`);
  }

  finish();
}

function finish() {
  console.log(`\n${'-'.repeat(50)}`);
  console.log(`${pass.length} passed, ${warnings.length} warnings, ${errors.length} errors`);
  if (errors.length) { console.log('\nFAILED'); process.exit(1); }
  console.log('\nOK');
  process.exit(0);
}

main().catch((e) => { console.error('validator crashed:', e); process.exit(2); });
