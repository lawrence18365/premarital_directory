/**
 * scripts/email/render-wordmark.mjs
 *
 * Renders the "Wedding Counselors" wordmark to a transparent PNG for use as
 * the inline (CID) logo in email signatures. Uses the site's real display
 * font (Cormorant Garamond) so the email signature matches the website.
 *
 * Output: client/public/weddingcounselors-wordmark.png
 */

import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', '..', 'client', 'public', 'weddingcounselors-wordmark.png')

const BRAND_DARK = '#0e5e5e'

const html = `<!doctype html><html><head>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&display=swap" rel="stylesheet">
  <style>
    html,body{margin:0;padding:0;background:transparent}
    body{padding:20px 28px;display:inline-block}
    .wordmark{
      font-family:'Cormorant Garamond',Georgia,serif;
      font-weight:700;font-size:84px;line-height:1;
      letter-spacing:-0.01em;color:${BRAND_DARK};white-space:nowrap;
    }
  </style>
</head><body><span class="wordmark">Wedding Counselors</span></body></html>`

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1400, height: 300, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle0' })
await page.evaluateHandle('document.fonts.ready')
const el = await page.$('.wordmark')
await el.screenshot({ path: OUT, omitBackground: true })
await browser.close()
console.log('Wrote', OUT)
