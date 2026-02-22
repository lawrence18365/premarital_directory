#!/usr/bin/env node

/**
 * Prerender Script for Wedding Counselors
 *
 * Uses Puppeteer to prerender all public SEO pages into static HTML.
 * Reads generated sitemap XMLs to build the route list, then:
 *  1. Serves the CRA build directory on a local port
 *  2. Visits each route in headless Chrome
 *  3. Waits for React + Supabase data fetching to finish
 *  4. Saves the fully-rendered HTML back to disk
 *
 * Result: crawlers receive full HTML with per-page titles, meta tags,
 * JSON-LD structured data, and actual content — no JS execution required.
 *
 * Usage: node scripts/prerender.js [--limit N]
 * Runs automatically as postbuild via package.json
 */

const fs = require('fs')
const path = require('path')
const http = require('http')
const puppeteer = require('puppeteer')

const BUILD_DIR = path.join(__dirname, '..', 'build')
const PORT = 45678 // Unlikely to conflict
const CONCURRENCY = 4 // Parallel browser tabs
const RENDER_TIMEOUT = 15000 // Max ms to wait for page to settle
const ORIGIN = 'https://www.weddingcounselors.com'
const DEFAULT_DESCRIPTION = 'Find qualified premarital counselors, therapists, and coaches near you.'

function parseBooleanEnv(value, fallback = true) {
  if (value === undefined || value === null || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

const INCLUDE_PROFILE_ROUTES = parseBooleanEnv(process.env.PRERENDER_INCLUDE_PROFILES, false)

// ---------------------------------------------------------------------------
// 1. Static file server (serves the CRA build output)
// ---------------------------------------------------------------------------

function createServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
    '.webmanifest': 'application/manifest+json',
    '.map': 'application/json'
  }

  return http.createServer((req, res) => {
    let filePath = path.join(BUILD_DIR, req.url === '/' ? '/index.html' : req.url)

    // SPA fallback: if no file exists, serve index.html (client-side routing)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      // Check if it's a directory with an index.html
      const dirIndex = path.join(filePath, 'index.html')
      if (fs.existsSync(dirIndex)) {
        filePath = dirIndex
      } else {
        filePath = path.join(BUILD_DIR, 'index.html')
      }
    }

    const ext = path.extname(filePath)
    const contentType = mimeTypes[ext] || 'application/octet-stream'

    try {
      const content = fs.readFileSync(filePath)
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })
}

// ---------------------------------------------------------------------------
// 2. Extract routes from sitemap XMLs
// ---------------------------------------------------------------------------

function extractUrlsFromSitemap(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`  Skipping ${path.basename(filePath)} (not found)`)
    return []
  }

  const xml = fs.readFileSync(filePath, 'utf-8')
  const urls = []
  const locRegex = /<loc>(.*?)<\/loc>/g
  let match

  while ((match = locRegex.exec(xml)) !== null) {
    let url = match[1]
    url = url.replace(/^https?:\/\/[^/]+/, '')
    if (url && !urls.includes(url)) {
      urls.push(url)
    }
  }

  return urls
}

function buildRouteList() {
  const sitemapFiles = [
    'sitemap-core.xml',
    'sitemap-cities.xml',
    'sitemap-blog.xml',
    'sitemap-profiles.xml',
    'sitemap-specialties.xml'
  ]

  const selectedSitemaps = INCLUDE_PROFILE_ROUTES
    ? sitemapFiles
    : sitemapFiles.filter(file => file !== 'sitemap-profiles.xml')

  const routes = new Set()
  routes.add('/')

  console.log('\n  Reading sitemap files for prerender routes...')
  console.log(`  Include profile routes: ${INCLUDE_PROFILE_ROUTES ? 'yes' : 'no'}`)

  for (const file of selectedSitemaps) {
    const filePath = path.join(BUILD_DIR, file)
    const urls = extractUrlsFromSitemap(filePath)
    urls.forEach(url => routes.add(url))
    if (urls.length > 0) {
      console.log(`  ${file}: ${urls.length} routes`)
    }
  }

  // Filter out private routes
  const excluded = ['/professional/', '/admin/', '/api/']
  const filtered = [...routes].filter(route =>
    !excluded.some(prefix => route.startsWith(prefix))
  )

  console.log(`  Total routes to prerender: ${filtered.length}`)
  return filtered
}

// ---------------------------------------------------------------------------
// 3. Render a single route and save the HTML
// ---------------------------------------------------------------------------

async function renderRoute(browser, route) {
  const page = await browser.newPage()

  // Set ReactSnap user agent so the app can detect prerender
  await page.setUserAgent('ReactSnap')

  // Block third-party requests (analytics, fonts, etc.) to speed up renders
  await page.setRequestInterception(true)
  page.on('request', req => {
    const url = req.url()
    if (url.startsWith(`http://localhost:${PORT}`)) {
      req.continue()
    } else if (url.includes('supabase.co') && !url.includes('/realtime/')) {
      // Allow Supabase REST API calls (needed for data) but block realtime WebSocket
      req.continue()
    } else {
      req.abort()
    }
  })

  try {
    await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: 'networkidle2',  // Allow 2 lingering connections (Supabase keepalive)
      timeout: RENDER_TIMEOUT
    })

    // Give React a moment to finish any remaining state updates
    await page.waitForFunction(
      () => document.getElementById('root')?.children?.length > 0,
      { timeout: 5000 }
    ).catch(() => { })

    // Compute the expected canonical URL for this route
    const normalizedRoute = route === '/' ? '/' : route.replace(/\/+$/, '')
    const expectedCanonical = normalizedRoute === '/'
      ? `${ORIGIN}/`
      : `${ORIGIN}${normalizedRoute}`

    // Wait for react-helmet to set the CORRECT canonical (not the default "/" one)
    const helmetReady = await page.waitForFunction(
      (expected, defaultDesc) => {
        const canon = document.querySelector('link[rel="canonical"][data-react-helmet="true"]')
        if (!canon) return false
        const href = canon.getAttribute('href') || ''
        // For homepage, just check it exists; for other routes, href must contain the route path
        const canonOk = expected.endsWith('/') || href.includes(expected.replace('https://www.weddingcounselors.com', ''))

        const desc = document.querySelector('meta[name="description"][data-react-helmet="true"]')
        // Description must exist and not be the generic homepage fallback (unless we ARE the homepage)
        const descOk = expected.endsWith('/')
          || (desc && !desc.getAttribute('content')?.startsWith(defaultDesc))

        return canonOk && descOk
      },
      { timeout: 5000 },
      expectedCanonical,
      DEFAULT_DESCRIPTION
    ).catch(() => null)

    if (!helmetReady && route !== '/') {
      console.warn(`\n  WARN: react-helmet did not set correct meta for ${route} (timed out)`)
    }

    // Small buffer for any remaining async helmet updates (OG, twitter, etc.)
    await new Promise(r => setTimeout(r, 200))

    // Remove the preloader and clean up duplicate/stale head tags
    await page.evaluate(() => {
      const preloader = document.getElementById('wc-preloader')
      if (preloader) preloader.remove()
      // Ensure body is visible
      document.body.classList.add('prerendered', 'loaded')
      document.body.style.opacity = '1'

      // --- Clean up duplicate meta tags ---
      // react-helmet tags have data-react-helmet="true"; remove any
      // non-helmet duplicates that share the same name/property attribute
      const helmetMetas = document.querySelectorAll('meta[data-react-helmet="true"]')
      const helmetKeys = new Set()
      helmetMetas.forEach(el => {
        const key = el.getAttribute('name') || el.getAttribute('property')
        if (key) helmetKeys.add(key)
      })
      // Remove non-helmet meta tags that have a helmet duplicate
      document.querySelectorAll('meta:not([data-react-helmet])').forEach(el => {
        const key = el.getAttribute('name') || el.getAttribute('property')
        if (key && helmetKeys.has(key)) el.remove()
      })

      // --- Clean up duplicate canonical links ---
      const helmetCanonical = document.querySelector('link[rel="canonical"][data-react-helmet="true"]')
      if (helmetCanonical) {
        document.querySelectorAll('link[rel="canonical"]:not([data-react-helmet])').forEach(el => el.remove())
      }

      // --- Clean up duplicate title tags ---
      const titles = document.querySelectorAll('title')
      if (titles.length > 1) {
        // Keep the last one (react-helmet's)
        for (let i = 0; i < titles.length - 1; i++) titles[i].remove()
      }

      // --- Clean up hardcoded JSON-LD that duplicates react-helmet's ---
      // react-helmet adds its own JSON-LD with data-react-helmet; remove
      // non-helmet JSON-LD Organization blocks to avoid duplication
      const helmetJsonLd = document.querySelector('script[type="application/ld+json"][data-react-helmet="true"]')
      if (helmetJsonLd) {
        document.querySelectorAll('script[type="application/ld+json"]:not([data-react-helmet])').forEach(el => {
          try {
            const data = JSON.parse(el.textContent)
            // Remove if it's an Organization or WebSite schema (SEOHelmet handles these)
            if (data['@type'] === 'Organization' || data['@type'] === 'WebSite') {
              el.remove()
            }
          } catch { /* skip malformed JSON-LD */ }
        })
      }
    })

    // Get the final HTML
    const html = await page.content()

    // Determine output path
    const cleanRoute = route === '/' ? '/' : route.replace(/\/$/, '')
    const outputDir = cleanRoute === '/'
      ? BUILD_DIR
      : path.join(BUILD_DIR, cleanRoute)
    const outputFile = path.join(outputDir, 'index.html')

    // Create directory and write file
    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(outputFile, html, 'utf-8')

    return { route, success: true, size: html.length }
  } catch (err) {
    return { route, success: false, error: err.message }
  } finally {
    await page.close()
  }
}

// ---------------------------------------------------------------------------
// 4. Process routes in parallel batches
// ---------------------------------------------------------------------------

async function processRoutes(browser, routes) {
  const results = []
  let completed = 0

  for (let i = 0; i < routes.length; i += CONCURRENCY) {
    const batch = routes.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map(route => renderRoute(browser, route))
    )
    results.push(...batchResults)
    completed += batch.length

    // Progress indicator
    const pct = Math.round((completed / routes.length) * 100)
    const ok = batchResults.filter(r => r.success).length
    const fail = batchResults.filter(r => !r.success).length
    process.stdout.write(
      `\r  Progress: ${completed}/${routes.length} (${pct}%) ` +
      `${fail > 0 ? `[${fail} failed in batch]` : ''}`
    )
  }

  process.stdout.write('\n')
  return results
}

// ---------------------------------------------------------------------------
// 5. Verification
// ---------------------------------------------------------------------------

function verifyResults(results) {
  const succeeded = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`\n  Results: ${succeeded.length} succeeded, ${failed.length} failed`)

  if (failed.length > 0 && failed.length <= 10) {
    console.log('  Failed routes:')
    failed.forEach(r => console.log(`    ${r.route}: ${r.error}`))
  } else if (failed.length > 10) {
    console.log(`  First 10 failed routes:`)
    failed.slice(0, 10).forEach(r => console.log(`    ${r.route}: ${r.error}`))
  }

  // Verify a sample profile page
  const sampleProfile = succeeded.find(r => r.route.split('/').length > 4)
  if (sampleProfile) {
    const samplePath = path.join(BUILD_DIR, sampleProfile.route, 'index.html')
    if (fs.existsSync(samplePath)) {
      const html = fs.readFileSync(samplePath, 'utf-8')
      const titleMatch = html.match(/<title>(.*?)<\/title>/)
      const title = titleMatch ? titleMatch[1] : '(none)'
      const hasCustomTitle = !title.startsWith('Find Premarital')
      const canonicalMatch = html.match(/rel="canonical"\s+href="([^"]*)"/)
      const canonical = canonicalMatch ? canonicalMatch[1] : '(none)'
      const canonicalCount = (html.match(/rel="canonical"/g) || []).length
      const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)
      const desc = descMatch ? descMatch[1].substring(0, 80) + '...' : '(none)'
      const hasJsonLd = (html.match(/application\/ld\+json/g) || []).length
      const hasProfileContent = html.length > 5000
      const isCanonicalCorrect = canonical.includes(sampleProfile.route.replace(/\/$/, ''))

      console.log('\n  Sample prerendered page verification:')
      console.log(`    Route:     ${sampleProfile.route}`)
      console.log(`    Title:     ${hasCustomTitle ? 'OK' : 'GENERIC'} — "${title}"`)
      console.log(`    Canonical: ${isCanonicalCorrect ? 'OK' : 'WRONG'} — "${canonical}" (${canonicalCount} tag(s))`)
      console.log(`    Desc:      ${desc}`)
      console.log(`    JSON-LD:   ${hasJsonLd} block(s)`)
      console.log(`    Size:      ${(sampleProfile.size / 1024).toFixed(1)} KB`)
      console.log(`    Content:   ${hasProfileContent ? 'OK' : 'THIN'}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n=== Prerender: baking SEO content into static HTML ===')

  // Allow skipping prerender entirely (e.g. push-triggered CI builds that don't deploy)
  if (parseBooleanEnv(process.env.SKIP_PRERENDER, false)) {
    console.log('  SKIP_PRERENDER=true — skipping prerender step.')
    return
  }

  if (!fs.existsSync(BUILD_DIR)) {
    console.error('Build directory not found. Run "npm run build" first.')
    process.exit(1)
  }

  // Parse --limit flag for testing
  const limitArg = process.argv.indexOf('--limit')
  const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity

  let routes = buildRouteList()

  if (limit < routes.length) {
    console.log(`  --limit ${limit}: only prerendering first ${limit} routes`)
    routes = routes.slice(0, limit)
  }

  // Incremental mode: skip routes whose cached HTML already exists in the build dir.
  // A previous run's output can be restored via GitHub Actions cache.
  // Set FULL_PRERENDER=true to force re-rendering all routes.
  const forceFullPrerender = parseBooleanEnv(process.env.FULL_PRERENDER, false)
  if (!forceFullPrerender) {
    const before = routes.length
    routes = routes.filter(route => {
      const cleanRoute = route === '/' ? '/' : route.replace(/\/$/, '')
      const htmlPath = path.join(BUILD_DIR, cleanRoute === '/' ? '' : cleanRoute, 'index.html')
      // The root index.html always exists (CRA shell), so always re-prerender '/'
      if (route === '/') return true
      return !fs.existsSync(htmlPath)
    })
    const skipped = before - routes.length
    if (skipped > 0) {
      console.log(`  Incremental mode: skipping ${skipped} cached routes, ${routes.length} new routes to render`)
    }
  }

  if (routes.length === 0) {
    console.log('  No routes found. Skipping prerender.')
    return
  }

  // Start local server
  const server = createServer()
  await new Promise(resolve => server.listen(PORT, resolve))
  console.log(`  Local server on port ${PORT}`)

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })
    console.log(`  Chrome: ${await browser.version()}`)

    const startTime = Date.now()
    const results = await processRoutes(browser, routes)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`  Completed in ${elapsed}s`)
    verifyResults(results)

    const failedCount = results.filter(r => !r.success).length
    if (failedCount > routes.length * 0.5) {
      console.error('  More than 50% of routes failed. Something is wrong.')
      process.exit(1)
    }
  } catch (err) {
    console.error('\n  Prerender failed:', err.message)
    if (process.env.CI) {
      // In CI (GitHub Actions), prerender MUST succeed — fail the build
      console.error('  CI detected: failing build because prerender is required for SEO.')
      process.exit(1)
    }
    console.log('  Continuing without prerendering (site falls back to client-side rendering).')
  } finally {
    if (browser) await browser.close()
    server.close()
  }

  console.log('=== Prerender done ===\n')
}

main()
