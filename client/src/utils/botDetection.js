/**
 * Detects likely bots, scrapers, and headless browsers.
 * Prevents them from polluting GA4 analytics data.
 */

let _isBotCached = null;

export function isLikelyBot() {
  if (_isBotCached !== null) return _isBotCached;

  try {
    const ua = (navigator.userAgent || '').toLowerCase();

    // 1. Known bot/scraper user agents
    const botPatterns = [
      'bot', 'crawl', 'spider', 'scrape', 'fetch',
      'headless', 'phantom', 'puppeteer', 'playwright',
      'selenium', 'webdriver', 'lighthouse', 'pagespeed',
      'slurp', 'mediapartners', 'feedfetcher',
      'python-requests', 'python-urllib', 'go-http-client',
      'curl/', 'wget/', 'httpx', 'aiohttp', 'axios/',
      'node-fetch', 'undici/', 'got/',
      'ahrefsbot', 'semrushbot', 'dotbot', 'mj12bot',
      'screaming frog', 'sitebulb', 'deepcrawl',
      'bytespider', 'petalbot', 'yandexbot',
      'reactsnap',
    ];

    if (botPatterns.some(p => ua.includes(p))) {
      _isBotCached = true;
      return true;
    }

    // 2. WebDriver flag (Selenium, Puppeteer, Playwright set this)
    if (navigator.webdriver) {
      _isBotCached = true;
      return true;
    }

    // 3. Timezone check — this is a US premarital counseling directory.
    //    Bots from Singapore/Asia use US Chrome UAs but can't fake timezone.
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const tzOffset = new Date().getTimezoneOffset();
      // US timezones are UTC-5 to UTC-10 (offset 300 to 600 minutes)
      // Also allow UTC-4 (Atlantic) and UTC-11 (Samoa)
      const isUSTimezone = tz.startsWith('America/') || tz.startsWith('Pacific/') || tz === 'US/Hawaii';
      const isUSOffset = tzOffset >= 240 && tzOffset <= 660;
      // Non-US timezone + non-US offset = almost certainly not a real US user
      if (!isUSTimezone && !isUSOffset) {
        _isBotCached = true;
        return true;
      }
    } catch (e) {
      // Timezone detection failed — continue to other checks
    }

    // 4. Combine weak signals — need 2+ to flag as bot
    const weakSignals = [
      // No browser plugins (headless browsers typically have 0)
      !navigator.plugins || navigator.plugins.length === 0,
      // No languages array
      !navigator.languages || navigator.languages.length === 0,
      // Chrome UA but missing window.chrome object (headless Chrome)
      !window.chrome && ua.includes('chrome'),
      // No connection info (many headless envs lack this)
      !navigator.connection && !navigator.mozConnection && !navigator.webkitConnection,
      // Zero screen dimensions
      (screen.width === 0 || screen.height === 0),
      // Language doesn't include English
      navigator.languages && navigator.languages.length > 0 && !navigator.languages.some(l => l.startsWith('en')),
    ].filter(Boolean).length;

    if (weakSignals >= 2) {
      _isBotCached = true;
      return true;
    }
  } catch (e) {
    // If we can't detect, allow through
    _isBotCached = false;
    return false;
  }

  _isBotCached = false;
  return false;
}
