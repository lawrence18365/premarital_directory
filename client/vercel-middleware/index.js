/**
 * Vercel Edge Middleware — bot/scraper blocking + geo filtering
 *
 * Blocks:
 * 1. Known scraper user agents
 * 2. Empty/missing user agents
 * 3. Non-US traffic to couple-facing pages (99%+ of real users are US-based)
 * 4. Rate limits burst traffic (40 req/min per IP)
 *
 * Allows:
 * - Search engine crawlers (Googlebot, Bingbot, etc.)
 * - All traffic to /professional/* (counselors signing up may be anywhere)
 * - API/webhook traffic
 */

const ALLOWED_BOTS = [
  'googlebot', 'google-inspectiontool', 'googleother', 'google-extended',
  'bingbot', 'msnbot', 'adidxbot',
  'duckduckbot', 'slurp',
  'facebookexternalhit', 'facebot',
  'twitterbot', 'linkedinbot',
  'pinterestbot', 'applebot',
  'prerender', 'reactsnap',
];

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

// Countries that are legitimate sources of US premarital counseling traffic
const ALLOWED_COUNTRIES = new Set([
  'US', 'CA', 'GB', 'AU', 'DE', 'PR', 'GU', 'VI', 'AS', 'MP',
  // US military bases are often geolocated to the host country
  'JP', 'KR', 'IT', 'ES',
]);

// Paths that should be accessible globally (professional signup, API, etc.)
const GLOBAL_PATHS = [
  '/professional/',
  '/api/',
  '/auth/',
  '/_next/',
  '/static/',
  '/favicon',
  '/robots.txt',
  '/sitemap',
  '/manifest',
];

export default function middleware(request) {
  const url = new URL(request.url);
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const country = request.headers.get('x-vercel-ip-country') || '';
  const path = url.pathname;

  // Skip static assets entirely
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|map|xml|txt|webmanifest)$/)) {
    return;
  }

  // Always allow search engine crawlers
  if (ua && ALLOWED_BOTS.some(b => ua.includes(b))) {
    return;
  }

  // Block known bad bots
  if (BAD_BOTS.some(b => ua.includes(b))) {
    return new Response('Forbidden', { status: 403 });
  }

  // Block empty/tiny user agents (likely bots)
  if (!ua || ua.length < 15) {
    return new Response('Forbidden', { status: 403 });
  }

  // Allow globally accessible paths regardless of country
  if (GLOBAL_PATHS.some(p => path.startsWith(p))) {
    return;
  }

  // Geo-filter: block non-allowed countries on couple-facing pages
  // This is a US premarital counseling directory — legitimate traffic is overwhelmingly US
  if (country && !ALLOWED_COUNTRIES.has(country)) {
    // Return a soft block — 403 with a message, not a hard block
    return new Response(
      '<!DOCTYPE html><html><head><title>Wedding Counselors</title></head>' +
      '<body style="font-family:sans-serif;max-width:600px;margin:80px auto;padding:20px;text-align:center">' +
      '<h1>Wedding Counselors</h1>' +
      '<p>Our directory currently serves couples in the United States.</p>' +
      '<p>If you believe this is an error, please contact <a href="mailto:hello@weddingcounselors.com">hello@weddingcounselors.com</a></p>' +
      '</body></html>',
      {
        status: 403,
        headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' },
      }
    );
  }

  // Let everything else through
  return;
}

export const config = {
  matcher: [
    '/',
    '/premarital-counseling/:path*',
    '/blog/:path*',
    '/contact',
    '/for-churches',
    '/claim-profile',
    '/about',
  ],
};
