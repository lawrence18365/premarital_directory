#!/usr/bin/env node
/**
 * Diagnostic test: prerender a profile page and inspect head tag state
 */

const fs = require('fs')
const path = require('path')
const http = require('http')
const puppeteer = require('puppeteer')

const BUILD_DIR = path.join(__dirname, '..', 'build')
const PORT = 45679
const ROUTE = process.argv[2] || '/premarital-counseling/nebraska/omaha/michelle-oczki'

const mimeTypes = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.xml': 'application/xml'
}

const server = http.createServer((req, res) => {
  let fp = path.join(BUILD_DIR, req.url === '/' ? '/index.html' : req.url)
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    const di = path.join(fp, 'index.html')
    fp = fs.existsSync(di) ? di : path.join(BUILD_DIR, 'index.html')
  }
  try {
    const c = fs.readFileSync(fp)
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(fp)] || 'application/octet-stream' })
    res.end(c)
  } catch {
    res.writeHead(404)
    res.end('nf')
  }
})

async function main() {
  await new Promise(r => server.listen(PORT, r))

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })
  const page = await browser.newPage()
  await page.setUserAgent('ReactSnap')
  await page.setRequestInterception(true)
  page.on('request', req => {
    const u = req.url()
    if (u.startsWith(`http://localhost:${PORT}`) || u.includes('supabase.co')) {
      req.continue()
    } else {
      req.abort()
    }
  })

  console.log(`Testing route: ${ROUTE}\n`)

  await page.goto(`http://localhost:${PORT}${ROUTE}`, {
    waitUntil: 'networkidle0',
    timeout: 15000
  })

  // Wait for root content
  await page.waitForFunction(
    () => document.getElementById('root') && document.getElementById('root').children.length > 0,
    { timeout: 5000 }
  ).catch(() => {})

  // Check at multiple time points to see when react-helmet updates
  for (const waitMs of [0, 500, 1000, 2000, 3000]) {
    if (waitMs > 0) await new Promise(r => setTimeout(r, waitMs - (waitMs === 500 ? 0 : waitMs - 500)))

    const snapshot = await page.evaluate(() => {
      const titles = [...document.querySelectorAll('title')]
      const helmeted = [...document.querySelectorAll('[data-react-helmet]')]
      const canonicals = [...document.querySelectorAll('link[rel="canonical"]')]
      const metaDescs = [...document.querySelectorAll('meta[name="description"]')]

      return {
        documentTitle: document.title,
        titleTags: titles.map(t => ({
          text: t.textContent,
          hasHelmet: t.hasAttribute('data-react-helmet')
        })),
        canonicals: canonicals.map(c => ({
          href: c.getAttribute('href'),
          hasHelmet: c.hasAttribute('data-react-helmet')
        })),
        metaDescs: metaDescs.map(m => ({
          content: m.getAttribute('content').substring(0, 80),
          hasHelmet: m.hasAttribute('data-react-helmet')
        })),
        helmetTagCount: helmeted.length,
        rootChildCount: document.getElementById('root').children.length
      }
    })

    console.log(`--- After ${waitMs}ms ---`)
    console.log(`  document.title: "${snapshot.documentTitle}"`)
    console.log(`  <title> tags (${snapshot.titleTags.length}):`)
    snapshot.titleTags.forEach(t => console.log(`    "${t.text}" [helmet=${t.hasHelmet}]`))
    console.log(`  canonicals (${snapshot.canonicals.length}):`)
    snapshot.canonicals.forEach(c => console.log(`    ${c.href} [helmet=${c.hasHelmet}]`))
    console.log(`  meta desc (${snapshot.metaDescs.length}):`)
    snapshot.metaDescs.forEach(m => console.log(`    "${m.content}..." [helmet=${m.hasHelmet}]`))
    console.log(`  data-react-helmet tags: ${snapshot.helmetTagCount}`)
    console.log(`  root children: ${snapshot.rootChildCount}`)
    console.log()
  }

  await browser.close()
  server.close()
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
