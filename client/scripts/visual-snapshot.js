/*
 * Visual snapshot harness for the design standardization workflow.
 *
 * Serves the production build (build/) as an SPA and screenshots a set of
 * routes at desktop and mobile widths using the puppeteer that already ships
 * with this repo. Output goes to client/visual-baseline/<viewport>/<name>.png.
 *
 * Usage:
 *   npm run build            (produce build/ first)
 *   node scripts/visual-snapshot.js            capture all routes
 *   node scripts/visual-snapshot.js home about start one or more by name
 *
 * This is a baseline-capture tool, not a diff tool. Capture before a change,
 * capture after, compare the PNGs by eye or wire in pixelmatch later.
 * Data-driven pages need the backend reachable to render fully.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const OUT_DIR = path.join(__dirname, '..', 'visual-baseline');
const PORT = 47811;

// Revenue-first route list. name is the output filename, route is the SPA path.
const ROUTES = [
  { name: 'home', route: '/' },
  { name: 'professionals', route: '/professionals' },
  { name: 'founding-provider', route: '/for-providers/founding' },
  { name: 'pricing', route: '/pricing' },
  { name: 'partners', route: '/partners' },
  { name: 'claim-profile', route: '/claim-profile' },
  { name: 'how-it-works', route: '/how-it-works' },
  { name: 'about', route: '/about' },
  { name: 'for-churches', route: '/for-churches' },
  { name: 'contact', route: '/contact' },
  { name: 'features', route: '/features' },
];

const VIEWPORTS = [
  { tag: 'desktop', width: 1280, height: 900 },
  { tag: 'mobile', width: 390, height: 844 },
];

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(BUILD_DIR, urlPath);
      // SPA fallback: if the path has no file extension or does not exist, serve index.html
      if (!path.extname(filePath) || !fs.existsSync(filePath)) {
        filePath = path.join(BUILD_DIR, 'index.html');
      }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function run() {
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    console.error('No build/ found. Run "npm run build" first.');
    process.exit(1);
  }
  const filter = process.argv.slice(2);
  const routes = filter.length ? ROUTES.filter((r) => filter.includes(r.name)) : ROUTES;

  const server = await startServer();
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  let ok = 0, failed = 0;
  for (const vp of VIEWPORTS) {
    const dir = path.join(OUT_DIR, vp.tag);
    fs.mkdirSync(dir, { recursive: true });
    for (const r of routes) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      try {
        await page.goto(`http://localhost:${PORT}${r.route}`, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise((res) => setTimeout(res, 1200)); // settle animations/fonts
        const is404 = await page.evaluate(() => document.body.innerText.includes('Page Not Found'));
        await page.screenshot({ path: path.join(dir, `${r.name}.png`), fullPage: true });
        console.log(`${is404 ? 'WARN(404)' : 'ok   '} ${vp.tag.padEnd(7)} ${r.name}`);
        ok++;
      } catch (e) {
        console.log(`FAIL ${vp.tag.padEnd(7)} ${r.name}  ${e.message.split('\n')[0]}`);
        failed++;
      }
      await page.close();
    }
  }
  await browser.close();
  server.close();
  console.log(`\n${ok} captured, ${failed} failed -> ${OUT_DIR}`);
}

run();
