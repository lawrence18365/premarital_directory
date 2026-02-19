#!/usr/bin/env node
/**
 * run-collector.js
 *
 * CLI for the source document collector (Step 2).
 *
 * Usage:
 *   node scripts/collector/run-collector.js --jurisdiction texas
 *   node scripts/collector/run-collector.js --all
 *   node scripts/collector/run-collector.js --stale        # re-fetch sources past next_crawl_at
 *   node scripts/collector/run-collector.js --find-sources --jurisdiction florida
 *   node scripts/collector/run-collector.js --add-source \
 *       --jurisdiction florida --url <url> --type state_statute
 *
 * Env vars (from client/.env):
 *   REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   BRAVE_SEARCH_API_KEY (for --find-sources)   ← root .env ONLY, never client/.env
 */

'use strict'

const path   = require('path')
const https  = require('https')
// Server-only secrets (BRAVE_SEARCH_API_KEY, etc.) → root .env (gitignored, never client/.env)
require('dotenv').config({ path: path.join(__dirname, '../../.env') })
// Supabase connection strings — CRA uses .env.local; fall back to .env
require('dotenv').config({ path: path.join(__dirname, '../../client/.env.local') })
require('dotenv').config({ path: path.join(__dirname, '../../client/.env') })

const zlib = require('zlib')
const { createClient } = require('@supabase/supabase-js')
const { fetchAndExtract, sha256 } = require('./fetch-source')
const { getKnownUrls, getBraveQueries, JURISDICTION_PRIORITY_ORDER } = require('./jurisdiction-sources')

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const BRAVE_KEY    = process.env.BRAVE_SEARCH_API_KEY

// Lazy: only commands that write to the DB need Supabase creds.
// --find-sources only needs BRAVE_SEARCH_API_KEY.
function requireSupabase() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing REACT_APP_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    console.error('   REACT_APP_SUPABASE_URL  → client/.env.local')
    console.error('   SUPABASE_SERVICE_ROLE_KEY → root .env (server-only)')
    process.exit(1)
  }
  return createClient(SUPABASE_URL, SERVICE_KEY)
}

let _supabase = null
function getSupabase() {
  if (!_supabase) _supabase = requireSupabase()
  return _supabase
}

// ─── Brave Search ─────────────────────────────────────────────────────────────

async function braveSearch(query) {
  if (!BRAVE_KEY) throw new Error('BRAVE_SEARCH_API_KEY not set in root .env (server-only — do NOT put this in client/.env)')

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.search.brave.com',
      path: `/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&country=us&safesearch=strict`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_KEY,
      },
    }

    const req = https.get(options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const raw = Buffer.concat(chunks)
        const encoding = (res.headers['content-encoding'] || '').toLowerCase()

        const parse = (buf) => {
          try {
            const body = JSON.parse(buf.toString('utf8'))
            resolve(body?.web?.results || [])
          } catch (e) {
            reject(new Error(`Brave Search parse error: ${e.message}`))
          }
        }

        if (encoding === 'gzip') {
          zlib.gunzip(raw, (err, decoded) => err ? reject(err) : parse(decoded))
        } else if (encoding === 'br') {
          zlib.brotliDecompress(raw, (err, decoded) => err ? reject(err) : parse(decoded))
        } else if (encoding === 'deflate') {
          zlib.inflate(raw, (err, decoded) => err ? reject(err) : parse(decoded))
        } else {
          parse(raw)
        }
      })
    })

    req.on('error', reject)
    req.setTimeout(15_000, () => { req.destroy(); reject(new Error('Brave Search timeout')) })
  })
}

/**
 * Score a search result URL by how likely it is to be a primary government source.
 * Higher = better. Returns 0-100.
 */
function scoreResultUrl(resultUrl) {
  const u = resultUrl.toLowerCase()
  if (u.includes('.gov')) return 90
  if (u.includes('legis.') || u.includes('legislature.') || u.includes('statutes.')) return 85
  if (u.includes('courts.') || u.includes('court.')) return 80
  if (u.includes('county') && u.includes('.gov')) return 75
  if (u.includes('.org')) return 40
  return 20
}

async function findSourcesForJurisdiction(jurisdictionId) {
  console.log(`\n🔍 Finding sources for: ${jurisdictionId}`)
  const queries = getBraveQueries(jurisdictionId)
  const seen = new Set()
  const candidates = []

  for (const query of queries.slice(0, 2)) {  // max 2 queries to be courteous
    console.log(`   Query: "${query}"`)
    const results = await braveSearch(query)
    for (const r of results) {
      if (seen.has(r.url)) continue
      seen.add(r.url)
      const score = scoreResultUrl(r.url)
      if (score >= 40) {  // filter out low-quality
        candidates.push({ url: r.url, title: r.title, score, description: r.description })
      }
    }
    await sleep(1000)  // rate limit
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates.slice(0, 5)
}

// ─── Supabase Storage upload ──────────────────────────────────────────────────

async function uploadBlob(sourceUrl, buffer, contentType) {
  const safeName = sourceUrl.replace(/[^a-z0-9]/gi, '_').slice(0, 100)
  const ext = contentType?.includes('pdf') ? '.pdf' : '.html'
  const blobPath = `source-documents/${safeName}${ext}`

  const { error } = await getSupabase().storage
    .from('source-documents')
    .upload(blobPath, buffer, { contentType, upsert: true })

  if (error) {
    console.warn(`  [storage] Failed to upload blob: ${error.message}`)
    return null
  }

  return blobPath
}

// ─── DB operations ───────────────────────────────────────────────────────────

async function upsertSourceDocument(doc) {
  const { error } = await getSupabase()
    .from('source_documents')
    .upsert(doc, { onConflict: 'url' })

  if (error) throw new Error(`DB upsert failed: ${error.message}`)
}

async function callDetectSourceChange(sourceId, newHash) {
  const { data, error } = await getSupabase()
    .rpc('detect_source_change', {
      p_source_id:  sourceId,
      p_new_hash:   newHash,
      p_fetched_at: new Date().toISOString(),
    })

  if (error) console.warn(`  [change_detect] RPC error: ${error.message}`)
  return data  // true = content changed
}

async function loadSourcesForJurisdiction(jurisdictionId) {
  const { data, error } = await getSupabase()
    .from('source_documents')
    .select('id, url, source_type, content_hash, jurisdiction_ids')
    .filter('jurisdiction_ids', 'cs', `{${jurisdictionId}}`)

  if (error) throw new Error(`DB query failed: ${error.message}`)
  return data || []
}

async function loadStaleSourcesFromDb() {
  const { data, error } = await getSupabase()
    .from('source_documents')
    .select('id, url, source_type, content_hash, jurisdiction_ids')
    .lt('next_crawl_at', new Date().toISOString())
    .order('priority', { ascending: true })
    .limit(50)

  if (error) throw new Error(`DB query failed: ${error.message}`)
  return data || []
}

// ─── Core: process one source ─────────────────────────────────────────────────

async function processSource(source, jurisdictionId) {
  const { url: sourceUrl, source_type, id: existingId } = source

  console.log(`\n  → Fetching: ${sourceUrl}`)

  const result = await fetchAndExtract(sourceUrl)

  if (!result.robots_allowed) {
    console.log(`  ✗ robots.txt disallows: ${sourceUrl}`)
    await upsertSourceDocument({
      url:               sourceUrl,
      source_type,
      robots_allowed:    false,
      extraction_status: 'skipped',
      jurisdiction_ids:  [jurisdictionId],
      fetch_errors:      [{ attempt_at: new Date().toISOString(), error: 'robots.txt disallows', http_status: null }],
    })
    return
  }

  if (result.error) {
    console.log(`  ✗ Fetch error: ${result.error}`)
    const { data: existing } = await getSupabase()
      .from('source_documents')
      .select('id, consecutive_failures, fetch_errors')
      .eq('url', sourceUrl)
      .maybeSingle()

    const failures = (existing?.consecutive_failures || 0) + 1
    const errLog = [
      ...(existing?.fetch_errors || []),
      { attempt_at: new Date().toISOString(), error: result.error, http_status: result.http_status },
    ].slice(-10)  // keep last 10 errors

    await upsertSourceDocument({
      url:                  sourceUrl,
      source_type,
      http_status:          result.http_status,
      robots_allowed:       result.robots_allowed,
      consecutive_failures: failures,
      fetch_errors:         errLog,
      jurisdiction_ids:     [jurisdictionId],
    })
    return
  }

  // Upload blob to storage
  let blobPath = null
  if (result.raw_body_buffer) {
    blobPath = await uploadBlob(sourceUrl, result.raw_body_buffer, result.content_type)
  }

  // Build the upsert payload
  const nextCrawlDays = source.recrawl_days || 30
  const nextCrawlAt = new Date(Date.now() + nextCrawlDays * 86_400_000).toISOString()

  const docPayload = {
    url:                  result.finalUrl !== result.url ? result.finalUrl : sourceUrl,
    source_type,
    title:                result.title,
    fetched_at:           new Date().toISOString(),
    http_status:          result.http_status,
    content_type:         result.content_type,
    etag:                 result.etag,
    last_modified:        result.last_modified,
    content_hash:         result.content_hash,
    raw_text:             result.raw_text,
    raw_blob_path:        blobPath,
    robots_allowed:       result.robots_allowed,
    consecutive_failures: 0,
    last_success_at:      new Date().toISOString(),
    fetch_errors:         [],
    next_crawl_at:        nextCrawlAt,
    jurisdiction_ids:     [jurisdictionId],
    extraction_status:    result.raw_text ? 'pending' : 'skipped',
  }

  await upsertSourceDocument(docPayload)

  // Check for content change if this source already existed
  if (existingId && result.content_hash) {
    const changed = await callDetectSourceChange(existingId, result.content_hash)
    if (changed) {
      console.log(`  ⚠️  Content changed — jurisdiction_benefits rows demoted to needs_review`)
    }
  }

  const wordCount = result.raw_text ? result.raw_text.split(/\s+/).length : 0
  console.log(`  ✓ Stored ${wordCount} words, hash: ${result.content_hash?.slice(0, 12)}…`)
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdFetchJurisdiction(jurisdictionId, seedFirst = false) {
  console.log(`\n📥 Collecting sources for: ${jurisdictionId}`)

  // Seed known URLs if they're not already in the DB
  if (seedFirst) {
    const knownUrls = getKnownUrls(jurisdictionId)
    for (const entry of knownUrls) {
      await upsertSourceDocument({
        url:              entry.url,
        source_type:      entry.source_type,
        priority:         entry.priority,
        recrawl_frequency_days: entry.recrawl_days,
        jurisdiction_ids: [jurisdictionId],
        extraction_status: 'pending',
      })
    }
  }

  const sources = await loadSourcesForJurisdiction(jurisdictionId)
  if (sources.length === 0) {
    console.log(`  No sources found for ${jurisdictionId}. Run --find-sources first or --add-source.`)
    return
  }

  for (const src of sources) {
    await processSource(src, jurisdictionId)
    await sleep(2000)  // polite crawl delay
  }
}

async function cmdFetchAll() {
  for (const jid of JURISDICTION_PRIORITY_ORDER) {
    await cmdFetchJurisdiction(jid, true)
  }
}

async function cmdFetchStale() {
  console.log('\n🔄 Fetching stale sources...')
  const sources = await loadStaleSourcesFromDb()
  if (sources.length === 0) {
    console.log('  Nothing stale. All sources are up to date.')
    return
  }
  console.log(`  ${sources.length} stale sources to re-fetch`)

  for (const src of sources) {
    const jid = src.jurisdiction_ids?.[0] || 'unknown'
    await processSource(src, jid)
    await sleep(2000)
  }
}

async function cmdFindSources(jurisdictionId) {
  const candidates = await findSourcesForJurisdiction(jurisdictionId)

  if (candidates.length === 0) {
    console.log('  No high-quality candidates found.')
    return
  }

  console.log('\n  📋 Top candidates (review these before adding):')
  candidates.forEach((c, i) => {
    console.log(`\n  [${i + 1}] Score: ${c.score}/100`)
    console.log(`       URL:   ${c.url}`)
    console.log(`       Title: ${c.title}`)
    console.log(`       Desc:  ${(c.description || '').slice(0, 120)}`)
  })

  console.log('\n  To add a source, run:')
  console.log(`    node scripts/collector/run-collector.js --add-source --jurisdiction ${jurisdictionId} --url <url> --type <source_type>`)
  console.log('  Source types: state_statute, county_clerk_site, official_form, state_agency, court_site, faq_page')
}

/**
 * Infer source_type from URL pattern.
 */
function inferSourceType(url) {
  const u = url.toLowerCase()
  if (u.endsWith('.pdf'))                                       return 'official_form'
  if (u.includes('statut') || u.includes('leg.') || u.includes('legis.') || u.includes('flsenate') || u.includes('revisor') || u.includes('oscn') || u.includes('tennesseecode') || u.includes('law.georgia') || u.includes('mgaleg') || u.includes('iga.in.gov') || u.includes('statutes.capitol')) return 'state_statute'
  if (u.includes('clerk'))                                      return 'county_clerk_site'
  if (u.includes('court'))                                      return 'court_site'
  return 'state_agency'
}

/**
 * Find sources via Brave Search and auto-register the top result for each
 * jurisdiction that doesn't already have any source_documents.
 */
async function cmdFindAndAdd(jurisdictionIds) {
  console.log(`\n🔍 Find-and-add for ${jurisdictionIds.length} jurisdiction(s)`)

  for (const jid of jurisdictionIds) {
    // Check if already has sources
    const existing = await loadSourcesForJurisdiction(jid)
    if (existing.length > 0) {
      console.log(`\n  ⏭  ${jid}: already has ${existing.length} source(s) — skipping`)
      continue
    }

    const candidates = await findSourcesForJurisdiction(jid)
    if (candidates.length === 0) {
      console.log(`\n  ⚠️  ${jid}: no candidates found`)
      continue
    }

    const best = candidates[0]
    const sourceType = inferSourceType(best.url)
    const priority = sourceType === 'state_statute' ? 1 : sourceType === 'official_form' ? 2 : 3

    await upsertSourceDocument({
      url:              best.url,
      source_type:      sourceType,
      title:            best.title || null,
      priority,
      recrawl_frequency_days: sourceType === 'official_form' ? 90 : 30,
      jurisdiction_ids: [jid],
      extraction_status: 'pending',
    })

    console.log(`\n  ✅ ${jid}: registered ${sourceType}`)
    console.log(`       URL:   ${best.url}`)
    console.log(`       Title: ${best.title}`)

    await sleep(1500)  // rate-limit Brave API
  }
}

async function cmdAddSource(jurisdictionId, sourceUrl, sourceType) {
  const VALID_TYPES = ['state_statute', 'county_clerk_site', 'official_form', 'state_agency', 'court_site', 'faq_page']
  if (!VALID_TYPES.includes(sourceType)) {
    console.error(`❌ Invalid source type: ${sourceType}`)
    console.error(`   Valid types: ${VALID_TYPES.join(', ')}`)
    process.exit(1)
  }

  const priority = sourceType === 'state_statute' ? 1 : sourceType === 'official_form' ? 2 : 3

  await upsertSourceDocument({
    url:              sourceUrl,
    source_type:      sourceType,
    priority,
    recrawl_frequency_days: sourceType === 'official_form' ? 90 : 30,
    jurisdiction_ids: [jurisdictionId],
    extraction_status: 'pending',
  })

  console.log(`✅ Registered source. Now run:`)
  console.log(`   node scripts/collector/run-collector.js --jurisdiction ${jurisdictionId}`)
}

// ─── CLI parsing ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        args[key] = next
        i++
      } else {
        args[key] = true
      }
    }
  }
  return args
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Main ─────────────────────────────────────────────────────────────────────

;(async () => {
  const args = parseArgs(process.argv)

  if (args.all) {
    await cmdFetchAll()

  } else if (args.stale) {
    await cmdFetchStale()

  } else if (args['find-and-add']) {
    // Discover + auto-register top URL for states that have no sources yet
    const jids = args.jurisdiction
      ? [args.jurisdiction]
      : JURISDICTION_PRIORITY_ORDER
    await cmdFindAndAdd(jids)

  } else if (args['find-sources'] && args.jurisdiction) {
    await cmdFindSources(args.jurisdiction)

  } else if (args['add-source']) {
    const { jurisdiction, url: sourceUrl, type } = args
    if (!jurisdiction || !sourceUrl || !type) {
      console.error('❌ --add-source requires --jurisdiction <id> --url <url> --type <type>')
      process.exit(1)
    }
    await cmdAddSource(jurisdiction, sourceUrl, type)

  } else if (args.jurisdiction) {
    await cmdFetchJurisdiction(args.jurisdiction, true)

  } else {
    console.log(`
📥 WeddingCounselors Source Collector

Usage:
  node scripts/collector/run-collector.js --jurisdiction texas
  node scripts/collector/run-collector.js --all
  node scripts/collector/run-collector.js --stale
  node scripts/collector/run-collector.js --find-sources --jurisdiction florida
  node scripts/collector/run-collector.js --add-source \\
      --jurisdiction florida --url <url> --type state_statute

Env vars (in client/.env):
  REACT_APP_SUPABASE_URL      required
  SUPABASE_SERVICE_ROLE_KEY   required
  BRAVE_SEARCH_API_KEY        required for --find-sources (root .env only)
`)
  }
})().catch(err => {
  console.error('\n❌', err.message)
  process.exit(1)
})
