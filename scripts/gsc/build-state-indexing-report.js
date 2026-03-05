#!/usr/bin/env node

/**
 * Build an inventory + GSC state indexing decision report.
 *
 * Usage:
 *   node scripts/gsc/build-state-indexing-report.js
 *
 * Required env vars:
 *   SUPABASE_SERVICE_ROLE_KEY
 * Optional env vars:
 *   SUPABASE_URL or REACT_APP_SUPABASE_URL
 *
 * Inputs:
 *   scripts/gsc/output/pages.json
 *   scripts/gsc/output/totals.json (optional, for date range labeling)
 *
 * Outputs:
 *   scripts/gsc/output/state_indexing_decisions_<start>_to_<end>.csv
 *   scripts/gsc/output/state_indexing_summary_<start>_to_<end>.md
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const OUTPUT_DIR = path.join(__dirname, 'output')
const PAGES_PATH = path.join(OUTPUT_DIR, 'pages.json')
const TOTALS_PATH = path.join(OUTPUT_DIR, 'totals.json')
const LOCATIONS_PATH = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'locations.json')

const FALLBACK_SUPABASE_URL = 'https://bkjwctlolhoxhnoospwp.supabase.co'

if (!fs.existsSync(PAGES_PATH)) {
  console.error('Missing GSC pages file:', PAGES_PATH)
  console.error('Run node scripts/gsc/pull-data.js first.')
  process.exit(1)
}

if (!fs.existsSync(LOCATIONS_PATH)) {
  console.error('Missing locations config:', LOCATIONS_PATH)
  process.exit(1)
}

const pages = JSON.parse(fs.readFileSync(PAGES_PATH, 'utf8'))
const totals = fs.existsSync(TOTALS_PATH)
  ? JSON.parse(fs.readFileSync(TOTALS_PATH, 'utf8'))
  : { dateRange: { start: 'unknown-start', end: 'unknown-end' } }

const { STATE_CONFIG } = JSON.parse(fs.readFileSync(LOCATIONS_PATH, 'utf8'))
const stateSlugs = Object.keys(STATE_CONFIG)
const stateSet = new Set(stateSlugs)

const slugByStateToken = new Map()
stateSlugs.forEach((slug) => {
  const cfg = STATE_CONFIG[slug]
  slugByStateToken.set(slug.toLowerCase(), slug)
  slugByStateToken.set(String(cfg?.abbr || '').toLowerCase(), slug)
  slugByStateToken.set(String(cfg?.name || '').toLowerCase(), slug)
})

function toStateSlug(token) {
  if (!token) return null
  const normalized = String(token).trim().toLowerCase()
  return slugByStateToken.get(normalized) || null
}

function normalizePath(url) {
  try {
    const parsed = new URL(url)
    return parsed.pathname.replace(/\/+$/, '') || '/'
  } catch {
    return null
  }
}

function metricSeed() {
  return { clicks: 0, impressions: 0, weightedPos: 0 }
}

function addMetric(bucket, row) {
  const clicks = Number(row.clicks || 0)
  const impressions = Number(row.impressions || 0)
  const position = Number(row.position || 0)
  bucket.clicks += clicks
  bucket.impressions += impressions
  bucket.weightedPos += position * impressions
}

function finalizeMetric(bucket) {
  const ctr = bucket.impressions > 0 ? (bucket.clicks / bucket.impressions) * 100 : 0
  const position = bucket.impressions > 0 ? bucket.weightedPos / bucket.impressions : 0
  return {
    clicks: Number(bucket.clicks.toFixed(2)),
    impressions: Number(bucket.impressions.toFixed(2)),
    ctr: Number(ctr.toFixed(2)),
    position: Number(position.toFixed(1))
  }
}

function csvEscape(value) {
  const s = String(value ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

async function fetchInventoryByState() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in environment')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const inventoryByState = Object.fromEntries(stateSlugs.map((slug) => [slug, 0]))

  const pageSize = 1000
  let from = 0

  while (true) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('profiles')
      .select('state_province')
      .eq('is_hidden', false)
      .or('moderation_status.eq.approved,moderation_status.is.null')
      .range(from, to)

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`)
    }

    const rows = data || []
    rows.forEach((row) => {
      const slug = toStateSlug(row.state_province)
      if (!slug || !stateSet.has(slug)) return
      inventoryByState[slug] += 1
    })

    if (rows.length < pageSize) break
    from += pageSize
  }

  return inventoryByState
}

async function main() {
  const canonicalByState = Object.fromEntries(stateSlugs.map((slug) => [slug, metricSeed()]))
  const legacyByState = Object.fromEntries(stateSlugs.map((slug) => [slug, metricSeed()]))

  pages.forEach((row) => {
    const pathname = normalizePath(row.page)
    if (!pathname) return

    const segments = pathname.split('/').filter(Boolean)
    if (segments.length !== 2) return

    const [root, slug] = segments
    if (!stateSet.has(slug)) return

    if (root === 'premarital-counseling') {
      addMetric(canonicalByState[slug], row)
    }

    if (root === 'professionals') {
      addMetric(legacyByState[slug], row)
    }
  })

  const inventoryByState = await fetchInventoryByState()

  const rows = stateSlugs.map((slug) => {
    const cfg = STATE_CONFIG[slug]
    const canonical = finalizeMetric(canonicalByState[slug])
    const legacy = finalizeMetric(legacyByState[slug])
    const combinedImpressions = canonical.impressions + legacy.impressions
    const combinedClicks = canonical.clicks + legacy.clicks
    const combinedCtr = combinedImpressions > 0 ? (combinedClicks / combinedImpressions) * 100 : 0
    const combinedPos = combinedImpressions > 0
      ? ((canonical.position * canonical.impressions) + (legacy.position * legacy.impressions)) / combinedImpressions
      : 0

    const inventoryCount = inventoryByState[slug] || 0
    const inventoryDecision = inventoryCount > 0 ? 'KEEP_INDEX' : 'NOINDEX'
    const inventoryReason = inventoryCount > 0
      ? 'Has active counselor inventory'
      : 'No active counselor inventory'
    const hasDemandSignal = combinedClicks > 0 || combinedImpressions >= 20
    const demandDecision = hasDemandSignal ? 'KEEP_INDEX' : 'NOINDEX_CANDIDATE'
    const demandReason = hasDemandSignal
      ? (combinedClicks > 0 ? 'Has clicks in period' : 'Has 20+ impressions in period')
      : 'Low demand in period (<20 impressions and 0 clicks)'
    const recommendedAction = hasDemandSignal ? 'KEEP_INDEX' : 'NOINDEX_CANDIDATE'

    return {
      state: cfg.name,
      slug,
      inventory_profiles: inventoryCount,
      canonical_clicks: canonical.clicks,
      canonical_impressions: canonical.impressions,
      canonical_ctr: canonical.ctr,
      canonical_position: canonical.position,
      legacy_clicks: legacy.clicks,
      legacy_impressions: legacy.impressions,
      legacy_ctr: legacy.ctr,
      legacy_position: legacy.position,
      combined_clicks: Number(combinedClicks.toFixed(2)),
      combined_impressions: Number(combinedImpressions.toFixed(2)),
      combined_ctr: Number(combinedCtr.toFixed(2)),
      combined_position: Number(combinedPos.toFixed(1)),
      inventory_decision: inventoryDecision,
      inventory_reason: inventoryReason,
      demand_decision: demandDecision,
      demand_reason: demandReason,
      recommended_action: recommendedAction
    }
  })

  rows.sort((a, b) => {
    if (b.combined_impressions !== a.combined_impressions) {
      return b.combined_impressions - a.combined_impressions
    }
    if (b.inventory_profiles !== a.inventory_profiles) {
      return b.inventory_profiles - a.inventory_profiles
    }
    return a.state.localeCompare(b.state)
  })

  const start = totals?.dateRange?.start || 'unknown-start'
  const end = totals?.dateRange?.end || 'unknown-end'

  const csvPath = path.join(OUTPUT_DIR, `state_indexing_decisions_${start}_to_${end}.csv`)
  const mdPath = path.join(OUTPUT_DIR, `state_indexing_summary_${start}_to_${end}.md`)

  const header = [
    'state',
    'slug',
    'inventory_profiles',
    'canonical_clicks',
    'canonical_impressions',
    'canonical_ctr',
    'canonical_position',
    'legacy_clicks',
    'legacy_impressions',
    'legacy_ctr',
    'legacy_position',
    'combined_clicks',
    'combined_impressions',
    'combined_ctr',
    'combined_position',
    'inventory_decision',
    'inventory_reason',
    'demand_decision',
    'demand_reason',
    'recommended_action'
  ]

  const csvLines = [header.join(',')]
  rows.forEach((row) => {
    csvLines.push(header.map((key) => csvEscape(row[key])).join(','))
  })
  fs.writeFileSync(csvPath, csvLines.join('\n'))

  const keepRows = rows.filter((row) => row.recommended_action === 'KEEP_INDEX')
  const noindexRows = rows.filter((row) => row.recommended_action === 'NOINDEX_CANDIDATE')
  const noInventoryDemand = noindexRows
    .filter((row) => row.inventory_profiles === 0 && row.combined_impressions >= 20)
    .sort((a, b) => b.combined_impressions - a.combined_impressions)

  const md = [
    `# State Indexing Decisions (${start} to ${end})`,
    '',
    `- Total states reviewed: ${rows.length}`,
    '- Demand rule: KEEP_INDEX if clicks > 0 OR impressions >= 20 (period)',
    `- KEEP_INDEX: ${keepRows.length}`,
    `- NOINDEX_CANDIDATE: ${noindexRows.length}`,
    '',
    '## KEEP_INDEX (demand-based)',
    ...keepRows
      .sort((a, b) => b.inventory_profiles - a.inventory_profiles || b.combined_impressions - a.combined_impressions)
      .map((row) => `- ${row.state} (${row.slug}): inventory ${row.inventory_profiles}, impressions ${row.combined_impressions}, clicks ${row.combined_clicks}`),
    '',
    '## NOINDEX_CANDIDATE (low demand in period)',
    ...noindexRows
      .sort((a, b) => b.combined_impressions - a.combined_impressions)
      .map((row) => `- ${row.state} (${row.slug}): inventory ${row.inventory_profiles}, impressions ${row.combined_impressions}, clicks ${row.combined_clicks}`),
    '',
    '## Demand Watchlist (no inventory but 20+ impressions)',
    ...(noInventoryDemand.length
      ? noInventoryDemand.map((row) => `- ${row.state}: ${row.combined_impressions} impressions, pos ${row.combined_position}`)
      : ['- None'])
  ].join('\n')

  fs.writeFileSync(mdPath, md)

  console.log(`Saved ${rows.length} state rows -> ${csvPath}`)
  console.log(`Saved summary -> ${mdPath}`)
  console.log(`KEEP_INDEX: ${keepRows.length} | NOINDEX_CANDIDATE: ${noindexRows.length}`)
}

main().catch((err) => {
  console.error('Failed to build state indexing report:', err.message)
  process.exit(1)
})
