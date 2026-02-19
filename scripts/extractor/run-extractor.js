#!/usr/bin/env node
/**
 * run-extractor.js
 *
 * CLI for the AI extractor (Step 3).
 *
 * Usage:
 *   node scripts/extractor/run-extractor.js --jurisdiction texas
 *   node scripts/extractor/run-extractor.js --pending         # all pending extractions
 *   node scripts/extractor/run-extractor.js --jurisdiction florida --dry-run
 *
 * Env vars:
 *   REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  ← root .env (service key) + client/.env.local (URL)
 *   KIMI_API_KEY                                        ← root .env ONLY, never client/.env
 */

'use strict'

const path = require('path')
// Server-only secrets (ANTHROPIC_API_KEY) → root .env (gitignored, never client/.env)
require('dotenv').config({ path: path.join(__dirname, '../../.env') })
// Supabase connection strings — CRA uses .env.local; fall back to .env
require('dotenv').config({ path: path.join(__dirname, '../../client/.env.local') })
require('dotenv').config({ path: path.join(__dirname, '../../client/.env') })

const { createClient } = require('@supabase/supabase-js')
const { extractSourceDocument } = require('./extract-jurisdiction')
const { validateJurisdictionBenefit, computeReadinessScore } = require('../../client/src/data/jurisdictionBenefitsSchema')

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const KIMI_KEY     = process.env.KIMI_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing REACT_APP_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in client/.env')
  process.exit(1)
}
if (!KIMI_KEY) {
  console.error('❌ Missing KIMI_API_KEY in root .env (server-only — do NOT put this in client/.env)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Load jurisdiction name from DB
async function getJurisdictionName(jurisdictionId) {
  const { data } = await supabase
    .from('jurisdiction_benefits')
    .select('jurisdiction_name')
    .eq('jurisdiction_id', jurisdictionId)
    .single()
  return data?.jurisdiction_name || jurisdictionId
}

// Load source documents for a jurisdiction that need extraction
async function loadPendingSources(jurisdictionId) {
  let query = supabase
    .from('source_documents')
    .select('id, url, source_type, raw_text, content_hash, content_type, title, fetched_at, jurisdiction_ids')
    .in('extraction_status', ['pending', 'needs_reextract'])
    .not('raw_text', 'is', null)
    .order('priority', { ascending: true })

  if (jurisdictionId) {
    query = query.filter('jurisdiction_ids', 'cs', `{${jurisdictionId}}`)
  }

  const { data, error } = await query.limit(20)
  if (error) throw new Error(`DB query failed: ${error.message}`)
  return data || []
}

// Load full jurisdiction_benefits row for post-extraction validation
async function loadJurisdictionRow(jurisdictionId) {
  const { data, error } = await supabase
    .from('jurisdiction_benefits')
    .select('*')
    .eq('jurisdiction_id', jurisdictionId)
    .single()
  if (error) throw new Error(`Load jurisdiction failed: ${error.message}`)
  return data
}

// Print a readiness report after extraction; optionally auto-approve
async function printReadinessReport(jurisdictionId, autoApproveThreshold = null) {
  const row = await loadJurisdictionRow(jurisdictionId)
  if (!row) return

  const { score, breakdown, indexed, noindexReason } = computeReadinessScore(row)
  const errors = validateJurisdictionBenefit(row)

  console.log('\n  📊 Post-extraction readiness:')
  console.log(`     Score: ${score}/100 (threshold: 70)`)
  console.log(`     Indexed: ${indexed ? '✅ YES' : '❌ NO — ' + noindexReason}`)
  console.log(`     Status: ${row.verification_status}`)

  if (Object.keys(breakdown).length) {
    console.log('     Breakdown:')
    for (const [check, pts] of Object.entries(breakdown)) {
      const max = { has_source_with_excerpt:20, has_statute_citation:15, has_hours_or_no_program:15, has_accepted_formats:15, has_provider_types:10, has_cert_fields:10, has_submission_where:10, recently_verified:5 }[check] || 0
      console.log(`       ${pts > 0 ? '✅' : '  '} ${check}: ${pts}/${max}`)
    }
  }

  if (errors.length) {
    console.log(`\n  ⚠️  Validation errors (fix before verifying):`)
    errors.forEach(e => console.log(`     - ${e}`))
    return
  }

  console.log('\n  ✅ No validation errors')

  // Auto-approve if threshold is set, confidence is high enough, and score is sufficient
  if (autoApproveThreshold !== null && row.verification_status !== 'verified') {
    // Re-load to get overall_confidence from the most recent extractor run
    const changeLog = row.change_log || []
    const lastExtraction = [...changeLog].reverse().find(e => e.action === 'extraction')
    const overallConfidence = lastExtraction?.confidence || 0

    if (overallConfidence >= autoApproveThreshold && score >= 70) {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('jurisdiction_benefits')
        .update({
          verification_status: 'verified',
          last_verified_at:    now,
          change_log: [
            ...changeLog,
            {
              changed_at: now,
              changed_by: `extractor:auto-approve`,
              action:     'verified',
              notes:      `Auto-approved: confidence ${(overallConfidence * 100).toFixed(0)}% >= ${(autoApproveThreshold * 100).toFixed(0)}% threshold, score ${score}/100`,
            },
          ].slice(-20),
        })
        .eq('jurisdiction_id', jurisdictionId)

      if (error) {
        console.log(`  ⚠️  Auto-approve failed: ${error.message}`)
      } else {
        console.log(`  🚀 Auto-approved (confidence ${(overallConfidence * 100).toFixed(0)}%, score ${score}/100) — now indexed`)
      }
    } else {
      console.log(`  ℹ️  Not auto-approved: confidence ${(overallConfidence * 100).toFixed(0)}% (need ${(autoApproveThreshold * 100).toFixed(0)}%), score ${score}/100 (need 70)`)
      console.log('     Review at /admin/benefits')
    }
  } else if (row.verification_status !== 'verified') {
    console.log('     Ready for human review at /admin/benefits')
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())  // camelCase
      const next = argv[i + 1]
      args[key] = (next && !next.startsWith('--')) ? (i++, next) : true
    }
  }
  return args
}

;(async () => {
  const args = parseArgs(process.argv)
  const dryRun = Boolean(args.dryRun)
  const confidenceThreshold = args.threshold ? parseFloat(args.threshold) : 0.70
  const autoApproveThreshold = args.autoApprove ? parseFloat(args.autoApprove === true ? '0.90' : args.autoApprove) : null

  if (args.pending || args.jurisdiction) {
    const jurisdictionId = args.jurisdiction || null
    const sources = await loadPendingSources(jurisdictionId)

    if (sources.length === 0) {
      console.log('✅ No pending sources to extract.')
      if (jurisdictionId) console.log(`   (Have you run the collector first? node scripts/collector/run-collector.js --jurisdiction ${jurisdictionId})`)
      process.exit(0)
    }

    console.log(`\n🤖 Extractor — ${sources.length} source(s) to process`)
    if (dryRun) console.log('   [DRY RUN mode — no DB writes]')
    if (autoApproveThreshold) console.log(`   [AUTO-APPROVE: confidence >= ${(autoApproveThreshold * 100).toFixed(0)}% AND score >= 70]`)

    const processedJurisdictions = new Set()

    for (const src of sources) {
      const jid = src.jurisdiction_ids?.[0] || jurisdictionId
      if (!jid) { console.warn('  Skipping source with no jurisdiction_id:', src.url); continue }

      const jName = await getJurisdictionName(jid)

      try {
        await extractSourceDocument(KIMI_KEY, supabase, src, jid, jName, { confidenceThreshold, dryRun })
        processedJurisdictions.add(jid)
      } catch (err) {
        console.error(`  ❌ Extraction failed for ${src.url}: ${err.message}`)
        if (!dryRun) {
          await supabase
            .from('source_documents')
            .update({ extraction_status: 'failed', fetch_errors: [{ attempt_at: new Date().toISOString(), error: err.message }] })
            .eq('url', src.url)
        }
      }

      await sleep(2000)  // rate limit between API calls
    }

    // Print readiness report (and optionally auto-approve) per jurisdiction
    if (!dryRun) {
      for (const jid of processedJurisdictions) {
        await printReadinessReport(jid, autoApproveThreshold)
      }
    }

  } else {
    console.log(`
🤖 WeddingCounselors AI Extractor

Usage:
  node scripts/extractor/run-extractor.js --jurisdiction texas
  node scripts/extractor/run-extractor.js --pending
  node scripts/extractor/run-extractor.js --jurisdiction florida --dry-run
  node scripts/extractor/run-extractor.js --pending --threshold 0.85
  node scripts/extractor/run-extractor.js --pending --auto-approve        # approve if confidence >= 90%
  node scripts/extractor/run-extractor.js --pending --auto-approve 0.85   # custom threshold

Flow:
  1. Run collector first: node scripts/collector/run-collector.js --jurisdiction <id>
  2. Run extractor:       node scripts/extractor/run-extractor.js --jurisdiction <id>
  3. Review at:          /admin/benefits (set verification_status = 'verified')

Env vars:
  REACT_APP_SUPABASE_URL    required  (client/.env.local)
  SUPABASE_SERVICE_ROLE_KEY required  (root .env)
  KIMI_API_KEY              required  (root .env only — never client/.env)
`)
  }
})().catch(err => {
  console.error('\n❌', err.message)
  process.exit(1)
})
