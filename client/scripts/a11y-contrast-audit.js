#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs/promises')
const fsSync = require('fs')
const path = require('path')
const http = require('http')
const { chromium } = require('playwright')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const BUILD_DIR = path.join(ROOT, 'build')
const OUTPUT_DIR = path.resolve(ROOT, '..', 'output', 'a11y')

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

function parseArgs(argv) {
  const options = {
    headless: true,
    maxRoutes: 0,
    port: 4173,
    routeFilter: '',
    timeoutMs: 30000,
    scanMode: 'template',
    templateLimit: 140,
    heuristic: false
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--headed') options.headless = false
    if (arg === '--headless') options.headless = true
    if (arg === '--port' && argv[i + 1]) options.port = Number(argv[++i])
    if (arg === '--max-routes' && argv[i + 1]) options.maxRoutes = Number(argv[++i])
    if (arg === '--filter' && argv[i + 1]) options.routeFilter = argv[++i]
    if (arg === '--timeout-ms' && argv[i + 1]) options.timeoutMs = Number(argv[++i])
    if (arg === '--full') options.scanMode = 'full'
    if (arg === '--template-only') options.scanMode = 'template'
    if (arg === '--template-limit' && argv[i + 1]) options.templateLimit = Number(argv[++i])
    if (arg === '--heuristic') options.heuristic = true
  }

  if (!Number.isFinite(options.port) || options.port <= 0) {
    throw new Error(`Invalid --port value: ${options.port}`)
  }
  if (!Number.isFinite(options.maxRoutes) || options.maxRoutes < 0) {
    throw new Error(`Invalid --max-routes value: ${options.maxRoutes}`)
  }
  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error(`Invalid --timeout-ms value: ${options.timeoutMs}`)
  }
  if (!Number.isFinite(options.templateLimit) || options.templateLimit <= 0) {
    throw new Error(`Invalid --template-limit value: ${options.templateLimit}`)
  }

  return options
}

async function ensureBuildExists() {
  const indexPath = path.join(BUILD_DIR, 'index.html')
  if (!fsSync.existsSync(indexPath)) {
    throw new Error(
      `Build output not found at ${indexPath}. Run "npm --prefix client run build" first.`
    )
  }
}

async function collectRoutesFromSitemaps() {
  const files = await fs.readdir(PUBLIC_DIR)
  const sitemapFiles = files.filter((file) => /^sitemap.*\.xml$/i.test(file))
  const routeSet = new Set()

  for (const file of sitemapFiles) {
    const xml = await fs.readFile(path.join(PUBLIC_DIR, file), 'utf8')
    const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g)
    for (const match of matches) {
      const loc = match[1].trim()
      if (!loc) continue
      if (loc.endsWith('.xml')) continue

      let pathname = null
      try {
        pathname = new URL(loc).pathname
      } catch (_error) {
        // fallback if loc isn't absolute URL
        if (loc.startsWith('/')) pathname = loc
      }
      if (!pathname) continue

      // Skip non-routable static files
      if (path.extname(pathname)) continue

      routeSet.add(pathname)
    }
  }

  routeSet.add('/')
  return Array.from(routeSet).sort((a, b) => a.localeCompare(b))
}

function sampleByPattern(routes, pattern, limit, exclude = new Set()) {
  const sampled = []
  for (const route of routes) {
    if (!pattern.test(route)) continue
    if (exclude.has(route)) continue
    sampled.push(route)
    if (sampled.length >= limit) break
  }
  return sampled
}

function buildTemplateRouteList(allRoutes, templateLimit) {
  const selected = new Set()

  const important = [
    '/',
    '/premarital-counseling',
    '/premarital-counseling/marriage-license-discount',
    '/about',
    '/contact',
    '/features',
    '/support',
    '/guidelines',
    '/pricing',
    '/blog',
    '/claim-profile',
    '/professional/login',
    '/professional/signup',
    '/professional/onboarding',
    '/professional/dashboard'
  ]

  important.forEach((route) => selected.add(route))

  const available = new Set(allRoutes)
  const existingSelected = new Set(Array.from(selected).filter((route) => available.has(route)))
  const selectedUnion = new Set([...selected, ...existingSelected])

  const oneSegPremarital = sampleByPattern(
    allRoutes,
    /^\/premarital-counseling\/[^/]+$/,
    18,
    new Set(['/premarital-counseling/marriage-license-discount'])
  )
  oneSegPremarital.forEach((route) => selectedUnion.add(route))

  const twoSegPremarital = sampleByPattern(
    allRoutes,
    /^\/premarital-counseling\/[^/]+\/[^/]+$/,
    42
  )
  twoSegPremarital.forEach((route) => selectedUnion.add(route))

  const threeSegPremarital = sampleByPattern(
    allRoutes,
    /^\/premarital-counseling\/[^/]+\/[^/]+\/[^/]+$/,
    32
  )
  threeSegPremarital.forEach((route) => selectedUnion.add(route))

  const blogPosts = sampleByPattern(allRoutes, /^\/blog\/[^/]+$/, 8)
  blogPosts.forEach((route) => selectedUnion.add(route))

  const coreStatic = sampleByPattern(
    allRoutes,
    /^\/(about|contact|features|support|guidelines|privacy|terms|thank-you|sitemap|professionals-search)$/,
    20
  )
  coreStatic.forEach((route) => selectedUnion.add(route))

  const ordered = Array.from(selectedUnion)
  const highPriorityOrder = new Map(important.map((route, idx) => [route, idx]))
  ordered.sort((a, b) => {
    const aPriority = highPriorityOrder.has(a) ? highPriorityOrder.get(a) : 999
    const bPriority = highPriorityOrder.has(b) ? highPriorityOrder.get(b) : 999
    if (aPriority !== bPriority) return aPriority - bPriority
    return a.localeCompare(b)
  })

  return ordered.slice(0, templateLimit)
}

function createSpaServer(port) {
  const server = http.createServer(async (req, res) => {
    try {
      const rawPath = decodeURIComponent((req.url || '/').split('?')[0])
      const normalizedPath = rawPath === '/' ? '/index.html' : rawPath
      const absoluteCandidate = path.join(BUILD_DIR, normalizedPath)
      let filePath = absoluteCandidate

      if (fsSync.existsSync(absoluteCandidate)) {
        const stat = fsSync.statSync(absoluteCandidate)
        if (stat.isDirectory()) {
          filePath = path.join(absoluteCandidate, 'index.html')
        }
      } else if (!path.extname(normalizedPath)) {
        // SPA route fallback
        filePath = path.join(BUILD_DIR, 'index.html')
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not Found')
        return
      }

      if (!fsSync.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not Found')
        return
      }

      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'
      const fileBuffer = await fs.readFile(filePath)
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(fileBuffer)
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(`Server Error: ${error.message}`)
    }
  })

  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(port, '127.0.0.1', () => resolve(server))
  })
}

function normalizeFailureSummary(summary) {
  return (summary || '')
    .replace(/\s+/g, ' ')
    .replace(/^Fix any of the following:\s*/i, '')
    .trim()
}

function groupIssues(issues) {
  const groups = new Map()
  for (const issue of issues) {
    const key = `${issue.help}|||${issue.summary}`
    if (!groups.has(key)) {
      groups.set(key, {
        count: 0,
        help: issue.help,
        summary: issue.summary,
        selectors: new Set(),
        routes: new Set()
      })
    }
    const group = groups.get(key)
    group.count += 1
    group.selectors.add(issue.selector || '(unknown selector)')
    group.routes.add(issue.route)
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      selectors: Array.from(group.selectors).slice(0, 12),
      routes: Array.from(group.routes).slice(0, 20)
    }))
    .sort((a, b) => b.count - a.count)
}

async function writeReport(report) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const jsonPath = path.join(OUTPUT_DIR, `contrast-report-${timestamp}.json`)
  const mdPath = path.join(OUTPUT_DIR, `contrast-report-${timestamp}.md`)

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8')

  const lines = []
  lines.push('# Color Contrast Audit Report')
  lines.push('')
  lines.push(`- Generated: ${report.generatedAt}`)
  lines.push(`- Routes scanned: ${report.routesScanned}`)
  lines.push(`- Routes with violations: ${report.routesWithViolations}`)
  lines.push(`- Total violations: ${report.totalViolations}`)
  lines.push(`- Total failed nodes: ${report.totalFailedNodes}`)
  lines.push('')

  if (report.groupedFindings.length === 0) {
    lines.push('No color-contrast violations found.')
  } else {
    lines.push('## Top Findings')
    lines.push('')
    report.groupedFindings.slice(0, 40).forEach((finding, index) => {
      lines.push(`${index + 1}. ${finding.help} (${finding.count} nodes)`)
      lines.push(`   - ${finding.summary}`)
      lines.push(`   - Selectors: ${finding.selectors.join(', ')}`)
      lines.push(`   - Example routes: ${finding.routes.join(', ')}`)
      lines.push('')
    })
  }

  await fs.writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8')
  return { jsonPath, mdPath }
}

async function run() {
  const options = parseArgs(process.argv.slice(2))
  await ensureBuildExists()

  let routes = await collectRoutesFromSitemaps()
  if (options.scanMode === 'template') {
    routes = buildTemplateRouteList(routes, options.templateLimit)
  }
  if (options.routeFilter) {
    routes = routes.filter((route) => route.includes(options.routeFilter))
  }
  if (options.maxRoutes > 0) {
    routes = routes.slice(0, options.maxRoutes)
  }

  if (routes.length === 0) {
    throw new Error('No routes found to scan.')
  }

  console.log(`Scan mode: ${options.scanMode}`)
  console.log(`Routes queued: ${routes.length}`)

  const server = await createSpaServer(options.port)
  const baseUrl = `http://127.0.0.1:${options.port}`
  const axeSource = await fs.readFile(require.resolve('axe-core/axe.min.js'), 'utf8')
  const browser = await chromium.launch({ headless: options.headless })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  })

  const issues = []
  const routeSummaries = []

  try {
    for (let i = 0; i < routes.length; i += 1) {
      const route = routes[i]
      const page = await context.newPage()
      const url = `${baseUrl}${route}`
      let routeIssueCount = 0

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: options.timeoutMs })
        await page.waitForTimeout(250)
        await page.addScriptTag({ content: axeSource })

        const axeResults = await page.evaluate(async () => {
          return window.axe.run(document, {
            runOnly: {
              type: 'rule',
              values: ['color-contrast']
            }
          })
        })

        const pageTitle = await page.title()
        for (const violation of axeResults.violations) {
          if (violation.id !== 'color-contrast') continue
          routeIssueCount += 1
          for (const node of violation.nodes) {
            issues.push({
              source: 'axe',
              ruleId: violation.id,
              route,
              pageTitle,
              help: violation.help,
              helpUrl: violation.helpUrl,
              impact: violation.impact,
              selector: (node.target || []).join(', '),
              htmlSnippet: (node.html || '').slice(0, 280),
              summary: normalizeFailureSummary(node.failureSummary)
            })
          }
        }

        if (options.heuristic) {
          const heuristicFindings = await page.evaluate(() => {
          function parseRgba(input) {
            if (!input) return null
            const value = input.trim().toLowerCase()
            if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
            const rgbaMatch = value.match(/rgba?\(([^)]+)\)/)
            if (!rgbaMatch) return null
            const parts = rgbaMatch[1].split(',').map((p) => p.trim())
            if (parts.length < 3) return null
            const r = Number(parts[0])
            const g = Number(parts[1])
            const b = Number(parts[2])
            const a = parts.length > 3 ? Number(parts[3]) : 1
            if (![r, g, b, a].every((n) => Number.isFinite(n))) return null
            return { r, g, b, a: Math.max(0, Math.min(1, a)) }
          }

          function composite(fg, bg) {
            const outA = fg.a + bg.a * (1 - fg.a)
            if (outA <= 0) return { r: 0, g: 0, b: 0, a: 0 }
            const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / outA
            const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / outA
            const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / outA
            return { r, g, b, a: outA }
          }

          function channelToLinear(c) {
            const x = c / 255
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
          }

          function luminance(color) {
            return (
              0.2126 * channelToLinear(color.r) +
              0.7152 * channelToLinear(color.g) +
              0.0722 * channelToLinear(color.b)
            )
          }

          function contrastRatio(fg, bg) {
            const l1 = luminance(fg)
            const l2 = luminance(bg)
            const lighter = Math.max(l1, l2)
            const darker = Math.min(l1, l2)
            return (lighter + 0.05) / (darker + 0.05)
          }

          function getPathSelector(el) {
            if (!el) return ''
            if (el.id) return `#${el.id}`
            const parts = []
            let node = el
            while (node && node.nodeType === 1 && parts.length < 4) {
              let part = node.tagName.toLowerCase()
              if (node.classList && node.classList.length > 0) {
                part += `.${node.classList[0]}`
              }
              const parent = node.parentElement
              if (parent) {
                const siblings = Array.from(parent.children).filter(
                  (s) => s.tagName === node.tagName
                )
                if (siblings.length > 1) {
                  const idx = siblings.indexOf(node) + 1
                  part += `:nth-of-type(${idx})`
                }
              }
              parts.unshift(part)
              node = node.parentElement
            }
            return parts.join(' > ')
          }

          function effectiveBackgroundColor(el) {
            const chain = []
            let node = el
            while (node && node.nodeType === 1) {
              chain.unshift(node)
              node = node.parentElement
            }

            let color = { r: 255, g: 255, b: 255, a: 1 }
            for (const item of chain) {
              const bgValue = window.getComputedStyle(item).backgroundColor
              const bg = parseRgba(bgValue)
              if (!bg || bg.a <= 0) continue
              color = composite(bg, color)
            }
            return color
          }

          function isVisible(el) {
            if (!el) return false
            const style = window.getComputedStyle(el)
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              Number(style.opacity || 1) < 0.1
            ) {
              return false
            }
            const rect = el.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0
          }

          const findings = []
          const seen = new Set()
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
          const textNodes = []
          while (walker.nextNode()) {
            textNodes.push(walker.currentNode)
          }

          for (const textNode of textNodes) {
            const text = (textNode.textContent || '').replace(/\s+/g, ' ').trim()
            if (!text) continue
            if (text.length < 2) continue
            const el = textNode.parentElement
            if (!el || !isVisible(el)) continue

            const style = window.getComputedStyle(el)
            const fgBase = parseRgba(style.color)
            if (!fgBase) continue

            const bg = effectiveBackgroundColor(el)
            const fg = composite(fgBase, bg)
            const ratio = contrastRatio(fg, bg)

            const fontSizePx = Number.parseFloat(style.fontSize || '16') || 16
            const fontWeight = Number.parseInt(style.fontWeight, 10) || 400
            const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700)
            const threshold = isLarge ? 3 : 4.5

            if (ratio >= threshold) continue

            const selector = getPathSelector(el)
            const key = `${selector}:::${text.slice(0, 40)}`
            if (seen.has(key)) continue
            seen.add(key)

            findings.push({
              selector,
              snippet: text.slice(0, 120),
              ratio: Number(ratio.toFixed(2)),
              threshold,
              fontSizePx: Number(fontSizePx.toFixed(2)),
              fontWeight
            })
          }

          findings.sort((a, b) => a.ratio - b.ratio)
          return findings.slice(0, 250)
          })

          for (const finding of heuristicFindings) {
            issues.push({
              source: 'heuristic',
              ruleId: 'heuristic-low-contrast',
              route,
              pageTitle,
              help: 'Potential low-contrast text',
              helpUrl: '',
              impact: 'serious',
              selector: finding.selector,
              htmlSnippet: finding.snippet,
              summary: `Contrast ${finding.ratio}:1 below ${finding.threshold}:1 (font ${finding.fontSizePx}px/${finding.fontWeight})`
            })
            routeIssueCount += 1
          }
        }
      } catch (error) {
        issues.push({
          source: 'system',
          ruleId: 'scan-failure',
          route,
          pageTitle: '',
          help: 'Page scan failed',
          helpUrl: '',
          impact: 'serious',
          selector: '',
          htmlSnippet: '',
          summary: `Failed to scan route: ${error.message}`
        })
      } finally {
        await page.close()
      }

      routeSummaries.push({
        route,
        issueCount: routeIssueCount
      })

      if ((i + 1) % 25 === 0 || i + 1 === routes.length) {
        console.log(`Scanned ${i + 1}/${routes.length} routes`)
      }
    }
  } finally {
    await context.close()
    await browser.close()
    await new Promise((resolve) => server.close(resolve))
  }

  const groupedFindings = groupIssues(issues)
  const routesWithViolations = new Set(issues.map((issue) => issue.route)).size
  const report = {
    generatedAt: new Date().toISOString(),
    routesScanned: routes.length,
    routesWithViolations,
    totalViolations: groupedFindings.length,
    totalFailedNodes: issues.length,
    routeSummaries: routeSummaries.sort((a, b) => b.issueCount - a.issueCount),
    groupedFindings,
    issues
  }

  const outputPaths = await writeReport(report)

  console.log('Contrast audit complete.')
  console.log(`Routes scanned: ${report.routesScanned}`)
  console.log(`Routes with violations: ${report.routesWithViolations}`)
  console.log(`Total failed nodes: ${report.totalFailedNodes}`)
  console.log(`JSON report: ${outputPaths.jsonPath}`)
  console.log(`Markdown report: ${outputPaths.mdPath}`)
}

run().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
