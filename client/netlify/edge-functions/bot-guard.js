/**
 * Netlify Edge Function — bot/scraper blocking
 *
 * Runs at the edge before the request reaches the origin.
 * Whitelists search engine crawlers, then blocks known scrapers,
 * headless browsers, and rate-limits suspicious burst traffic.
 */

// In-memory rate limit map (per edge node — good enough for burst detection)
const ipHits = new Map();
const WINDOW_MS = 60_000; // 1 minute
const MAX_HITS = 40; // requests per minute per IP

// Search engine / social bots we WANT to crawl the site (for SEO)
const ALLOWED_BOTS = [
  'googlebot', 'google-inspectiontool', 'googleother',
  'bingbot', 'msnbot', 'adidxbot',
  'duckduckbot', 'slurp',
  'facebookexternalhit', 'facebot',
  'twitterbot', 'linkedinbot',
  'pinterestbot', 'applebot',
  'prerender',
];

// Known scraper / SEO tool user agents to BLOCK
const BAD_BOTS = [
  'ahrefsbot', 'semrushbot', 'dotbot', 'mj12bot', 'blexbot',
  'bytespider', 'petalbot', 'sogou', 'yandexbot', 'baiduspider',
  'megaindex', 'serpstatbot', 'zoominfobot', 'dataforseo',
  'screaming frog', 'sitebulb', 'deepcrawl', 'netpeak',
  'python-requests', 'python-urllib', 'go-http-client', 'java/',
  'curl/', 'wget/', 'httpx', 'aiohttp', 'node-fetch', 'undici/',
  'scrapy', 'httpclient', 'libwww-perl', 'mechanize',
  'headlesschrome', 'phantomjs', 'puppeteer', 'playwright',
  'selenium', 'webdriver',
];

function classifyUA(ua) {
  if (!ua || ua.length < 10) return 'empty';
  const lower = ua.toLowerCase();
  if (ALLOWED_BOTS.some(b => lower.includes(b))) return 'allowed';
  if (BAD_BOTS.some(b => lower.includes(b))) return 'bad';
  return 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || now - entry.start > WINDOW_MS) {
    ipHits.set(ip, { start: now, count: 1 });
    return false;
  }

  entry.count++;
  return entry.count > MAX_HITS;
}

// Periodically prune stale entries to prevent memory leak
let lastPrune = Date.now();
function pruneIfNeeded() {
  const now = Date.now();
  if (now - lastPrune < WINDOW_MS * 2) return;
  lastPrune = now;
  for (const [ip, entry] of ipHits) {
    if (now - entry.start > WINDOW_MS) ipHits.delete(ip);
  }
}

export default async function handler(request, context) {
  const ua = request.headers.get('user-agent') || '';
  const ip = context.ip;
  const classification = classifyUA(ua);

  // 1. Always let search engine / social crawlers through
  if (classification === 'allowed') {
    return context.next();
  }

  // 2. Block known bad bots and empty UAs
  if (classification === 'bad' || classification === 'empty') {
    return new Response('Access denied', { status: 403 });
  }

  // 3. Rate limit everyone else — block IPs making 40+ req/min
  pruneIfNeeded();
  if (isRateLimited(ip)) {
    return new Response('Too many requests', {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  // 4. Let legitimate traffic through
  return context.next();
}

export const config = {
  // Run on page routes, skip static assets and sitemaps
  path: [
    '/',
    '/premarital-counseling/*',
    '/professional/*',
    '/claim-profile',
    '/contact',
    '/for-churches',
    '/blog/*',
  ],
};
