/**
 * fetch-source.js
 *
 * Core fetcher for a single source URL.
 * Handles: HTML (text extraction), PDF (text extraction), robots.txt.
 * Returns a structured result that run-collector.js writes to source_documents.
 *
 * Dependencies: Node built-ins only (https, crypto, url).
 * Optional: pdf-parse (npm install pdf-parse) for PDF text extraction.
 */

'use strict'

const https = require('https')
const http  = require('http')
const crypto = require('crypto')
const url   = require('url')

const USER_AGENT = 'WeddingCounselors-BenefitsBot/1.0 (+https://www.weddingcounselors.com/editorial-standards)'
const FETCH_TIMEOUT_MS = 30_000
const MAX_REDIRECTS = 5
const MAX_BODY_BYTES = 5 * 1024 * 1024  // 5 MB cap

// ─── HTTP fetch with redirects ────────────────────────────────────────────────

/**
 * Fetches a URL and follows redirects up to MAX_REDIRECTS.
 * @returns {{ statusCode, headers, body: Buffer, finalUrl: string }}
 */
async function fetchUrl(targetUrl, redirectCount = 0) {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error(`Too many redirects (${MAX_REDIRECTS} max) for ${targetUrl}`)
  }

  const parsed = new url.URL(targetUrl)
  const lib = parsed.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const chunks = []
    let totalBytes = 0

    const req = lib.get(
      targetUrl,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/pdf,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: FETCH_TIMEOUT_MS,
      },
      (res) => {
        // Follow redirects
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          const location = res.headers['location']
          if (!location) return reject(new Error(`Redirect with no Location header from ${targetUrl}`))
          // Resolve relative redirects
          const nextUrl = new url.URL(location, targetUrl).toString()
          res.resume()
          return resolve(fetchUrl(nextUrl, redirectCount + 1))
        }

        res.on('data', (chunk) => {
          totalBytes += chunk.length
          if (totalBytes > MAX_BODY_BYTES) {
            req.destroy()
            reject(new Error(`Response too large (>${MAX_BODY_BYTES} bytes) for ${targetUrl}`))
            return
          }
          chunks.push(chunk)
        })

        res.on('end', () => resolve({
          statusCode: res.statusCode,
          headers:    res.headers,
          body:       Buffer.concat(chunks),
          finalUrl:   targetUrl,
        }))

        res.on('error', reject)
      }
    )

    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Request timed out after ${FETCH_TIMEOUT_MS}ms for ${targetUrl}`))
    })

    req.on('error', reject)
  })
}

// ─── robots.txt check ─────────────────────────────────────────────────────────

const robotsCache = new Map()

async function isAllowedByRobots(targetUrl) {
  const parsed = new url.URL(targetUrl)
  const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`

  let robotsText = robotsCache.get(parsed.host)
  if (robotsText === undefined) {
    try {
      const res = await fetchUrl(robotsUrl)
      robotsText = res.statusCode === 200 ? res.body.toString('utf8') : ''
    } catch {
      robotsText = ''  // if we can't fetch robots.txt, assume allowed
    }
    robotsCache.set(parsed.host, robotsText)
  }

  if (!robotsText) return true

  // Simple parser: look for User-agent: * or our bot, then check Disallow rules
  const path = parsed.pathname + (parsed.search || '')
  const lines = robotsText.split('\n').map(l => l.trim())
  let applies = false

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.startsWith('user-agent:')) {
      const agent = lower.replace('user-agent:', '').trim()
      applies = agent === '*' || USER_AGENT.toLowerCase().includes(agent)
    }
    if (applies && lower.startsWith('disallow:')) {
      const disallowed = line.replace(/disallow:/i, '').trim()
      if (disallowed && path.startsWith(disallowed)) return false
    }
  }

  return true
}

// ─── HTML text extraction ──────────────────────────────────────────────────────

/**
 * Strips HTML tags and decodes common entities.
 * Focuses on main content: removes <script>, <style>, <nav>, <header>, <footer>.
 * Returns plain text with normalized whitespace.
 */
function extractTextFromHtml(html) {
  let text = html

  // Remove noisy blocks first
  text = text.replace(/<(script|style|noscript|nav|header|footer|aside|iframe)[^>]*>[\s\S]*?<\/\1>/gi, ' ')

  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&quot;': '"', '&#39;': "'", '&nbsp;': ' ',
    '&mdash;': '—', '&ndash;': '–', '&ldquo;': '"', '&rdquo;': '"',
    '&lsquo;': "'", '&rsquo;': "'", '&sect;': '§',
  }
  for (const [entity, char] of Object.entries(entities)) {
    text = text.split(entity).join(char)
  }
  // Numeric entities
  text = text.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))

  // Normalize whitespace
  text = text.replace(/\s{2,}/g, ' ').trim()

  return text
}

/**
 * Extract <title> from HTML.
 */
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? m[1].trim().replace(/\s+/g, ' ') : null
}

// ─── PDF text extraction ──────────────────────────────────────────────────────

/**
 * Attempt PDF text extraction using pdf-parse (optional dependency).
 * Returns null if pdf-parse is not installed.
 */
async function extractTextFromPdf(buffer) {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    return data.text ? data.text.replace(/\s{2,}/g, ' ').trim() : null
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn('  [pdf-parse not installed] PDF text extraction skipped. Run: npm install pdf-parse')
      return null
    }
    console.warn(`  [pdf-parse error] ${err.message}`)
    return null
  }
}

// ─── SHA-256 hash ─────────────────────────────────────────────────────────────

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

// ─── Main fetch-and-extract function ──────────────────────────────────────────

/**
 * Fetches a URL, extracts text, computes hash.
 *
 * @param {string} sourceUrl
 * @returns {{
 *   url: string,
 *   finalUrl: string,
 *   http_status: number,
 *   content_type: string,
 *   etag: string|null,
 *   last_modified: string|null,
 *   title: string|null,
 *   raw_text: string|null,
 *   content_hash: string|null,
 *   raw_body_buffer: Buffer|null,
 *   robots_allowed: boolean,
 *   error: string|null,
 * }}
 */
async function fetchAndExtract(sourceUrl) {
  const result = {
    url:             sourceUrl,
    finalUrl:        sourceUrl,
    http_status:     null,
    content_type:    null,
    etag:            null,
    last_modified:   null,
    title:           null,
    raw_text:        null,
    content_hash:    null,
    raw_body_buffer: null,
    robots_allowed:  null,
    error:           null,
  }

  try {
    // 1. robots.txt check
    result.robots_allowed = await isAllowedByRobots(sourceUrl)
    if (!result.robots_allowed) {
      result.error = 'robots.txt disallows crawl'
      return result
    }

    // 2. Fetch
    const { statusCode, headers, body, finalUrl } = await fetchUrl(sourceUrl)
    result.finalUrl      = finalUrl
    result.http_status   = statusCode
    result.content_type  = headers['content-type'] || null
    result.etag          = headers['etag'] || null
    result.last_modified = headers['last-modified'] || null

    if (statusCode !== 200) {
      result.error = `HTTP ${statusCode}`
      return result
    }

    result.raw_body_buffer = body
    const ct = (result.content_type || '').toLowerCase()

    // 3. Text extraction
    if (ct.includes('application/pdf')) {
      const text = await extractTextFromPdf(body)
      if (text) {
        result.raw_text = text
      } else {
        // Can't extract text; store blob only
        result.raw_text = null
        result.error    = 'PDF text extraction unavailable; blob stored only'
      }
    } else if (ct.includes('text/html') || ct.includes('text/plain')) {
      const html = body.toString('utf8')
      result.title    = extractTitle(html)
      result.raw_text = extractTextFromHtml(html)
    } else {
      result.error = `Unsupported content-type: ${result.content_type}`
      return result
    }

    // 4. Hash
    if (result.raw_text) {
      result.content_hash = sha256(result.raw_text)
    }

  } catch (err) {
    result.error = err.message
  }

  return result
}

module.exports = { fetchAndExtract, sha256 }
