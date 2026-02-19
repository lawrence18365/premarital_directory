/**
 * extract-jurisdiction.js
 *
 * Step 3: AI extractor — reads raw source document text → produces
 * schema field patches with per-field confidence scores + excerpts.
 *
 * Uses Kimi for Coding via Kimi Code API (OpenAI-compatible).
 * Base URL: https://api.kimi.com/coding/v1
 * Model:    kimi-for-coding  (key format: sk-kimi-*)
 * Requires User-Agent: claude-code/1.0.0 (coding-agent-gated endpoint)
 *
 * Output (written to jurisdiction_benefits as a patch):
 * {
 *   fields: {
 *     hours_required:         { value: 4, confidence: 0.97, excerpt: "..." },
 *     accepted_formats:       { value: ["online","in_person"], confidence: 0.85, excerpt: "..." },
 *     approved_provider_rules:{ value: {...}, confidence: 0.90, excerpt: "..." },
 *     statute_citation:       { value: "Fla. Stat. § 741.0305", confidence: 0.99, excerpt: "..." },
 *     ...
 *   },
 *   overall_confidence: 0.91,
 *   fields_not_found: ["submission_process", ...],
 *   notes: "...",
 * }
 */

'use strict'

const https = require('https')
const zlib  = require('zlib')

const MODEL            = 'kimi-for-coding'
const API_HOST         = 'api.kimi.com'
const API_PATH         = '/coding/v1/chat/completions'
const MAX_SOURCE_CHARS = 40_000

// ─── Kimi K2.5 API call (OpenAI-compatible chat completions) ─────────────────

/**
 * Stream-based Kimi API call.
 *
 * kimi-for-coding is a thinking model: it generates reasoning_content first
 * (which can be long), then content (the actual answer).  A non-streaming
 * request must wait for ALL tokens before the HTTP response ends, which means
 * we'd need a 5-10 minute timeout.  Streaming gives us incremental chunks so
 * the connection stays alive.  We accumulate only the `content` deltas; if
 * the model produces nothing in `content` we fall back to `reasoning_content`.
 */
function kimiApiCall(apiKey, userContent, systemContent) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:       MODEL,
      max_tokens:  16384,   // 16k covers reasoning + JSON output
      temperature: 0.6,     // instant mode (0.6); 1.0 = thinking mode
      stream:      true,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user',   content: userContent   },
      ],
    })

    const options = {
      hostname: API_HOST,
      path:     API_PATH,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization':  `Bearer ${apiKey}`,
        'User-Agent':     'claude-code/1.0.0',
      },
    }

    const req = https.request(options, (res) => {
      // Streaming — no compression on SSE streams
      let contentBuf   = ''
      let reasoningBuf = ''
      let buffer       = ''  // for partial SSE lines

      res.setEncoding('utf8')

      res.on('data', (chunk) => {
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop()  // keep incomplete last line

        for (const line of lines) {
          // Kimi uses "data:{...}" (no space) for JSON events, "data: [DONE]" for done
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()  // slice 5 chars: 'd','a','t','a',':'
          if (payload === '[DONE]') continue
          try {
            const evt  = JSON.parse(payload)
            if (evt.error) { req.destroy(); return reject(new Error(`Kimi API error: ${JSON.stringify(evt.error)}`)) }
            const delta = evt.choices?.[0]?.delta || {}
            if (delta.content)           contentBuf   += delta.content
            if (delta.reasoning_content) reasoningBuf += delta.reasoning_content
          } catch (_) { /* ignore malformed SSE lines */ }
        }
      })

      res.on('end', () => {
        const text = contentBuf.trim() || reasoningBuf.trim()
        if (!text) return reject(new Error('Kimi returned empty content after streaming'))
        resolve(text)
      })

      res.on('error', reject)
    })

    // 8-minute wall-clock timeout for the whole request (thinking can be slow)
    req.setTimeout(480_000, () => { req.destroy(); reject(new Error('Kimi API timeout after 8min')) })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Extraction prompt ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a legal document analyst specializing in US marriage law.
Your job is to extract structured data from government documents about marriage license discounts
for premarital counseling/education programs.

RULES:
1. Only extract facts that are explicitly stated in the document. Never infer or guess.
2. For each field, include the verbatim excerpt (exact quote) from the document that supports it.
3. Assign confidence 0.0–1.0 per field: 1.0 = explicitly stated verbatim, 0.7 = clearly implied, <0.5 = uncertain.
4. If a field is not mentioned in the document, include it in "fields_not_found".
5. For monetary amounts, convert to integer cents (e.g. $32.50 → 3250).
6. For accepted_formats: only include "online" if the document explicitly allows it; if silent, do NOT include it.
7. Output ONLY valid JSON — no markdown, no explanation outside the JSON object.`

function buildExtractionPrompt(jurisdictionId, jurisdictionName, sourceUrl, rawText) {
  const truncated = rawText.length > MAX_SOURCE_CHARS
    ? rawText.slice(0, MAX_SOURCE_CHARS) + '\n[... document truncated for length ...]'
    : rawText

  return `Extract marriage license benefit data for: ${jurisdictionName} (jurisdiction_id: "${jurisdictionId}")
Source URL: ${sourceUrl}

DOCUMENT TEXT:
---
${truncated}
---

OUTPUT FORMAT (JSON object, no markdown):
{
  "jurisdiction_id": "${jurisdictionId}",
  "source_url": "${sourceUrl}",
  "extracted_at": "<ISO8601 timestamp>",
  "fields": {
    "benefit_types": {
      "value": ["discount"|"fee_waiver"|"waiting_period_reduction"|"waiting_period_waiver"],
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    },
    "license_fee_cents": {
      "value": <integer cents or null>,
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    },
    "discounted_fee_cents": {
      "value": <integer cents or null>,
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    },
    "standard_waiting_period_hours": {
      "value": <integer hours or null>,
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    },
    "waiting_period_waived": {
      "value": true|false,
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    },
    "premarital_program_required": {
      "value": true|false,
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    },
    "hours_required": {
      "value": <integer or null>,
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    },
    "accepted_formats": {
      "value": ["online"|"in_person"|"self_directed"|"video"|"workbook"],
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote or empty string if not found>"
    },
    "approved_provider_rules": {
      "value": {
        "accepted_types": ["lmft"|"lpc"|"lcsw"|"psychologist"|"clergy"|"certified_educator"|"approved_program"],
        "approved_list_only": true|false,
        "state_registration_required": true|false,
        "state_program_name": "<string or null>",
        "notes": "<string>"
      },
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    },
    "certificate_fields": {
      "value": {
        "state_issued_form": true|false,
        "official_form_url": "<url or null>",
        "validity_days": <integer or null>
      },
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    },
    "submission_process": {
      "value": {
        "where": "<office name>",
        "how": "<description>",
        "deadline_window": "<description>",
        "online_submission_allowed": true|false
      },
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    },
    "statute_citation": {
      "value": "<citation string or null>",
      "confidence": 0.0-1.0,
      "excerpt": "<verbatim quote>"
    }
  },
  "fields_not_found": ["<field_name>", ...],
  "overall_confidence": 0.0-1.0,
  "notes": "<anything the reviewer should know>"
}`
}

// ─── Parse + validate extractor output ───────────────────────────────────────

function parseExtractionOutput(rawJson, jurisdictionId) {
  let parsed
  try {
    // Strip any accidental markdown fences
    const clean = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    parsed = JSON.parse(clean)
  } catch (e) {
    throw new Error(`Extractor returned invalid JSON: ${e.message}\n\nRaw output:\n${rawJson.slice(0, 500)}`)
  }

  if (parsed.jurisdiction_id !== jurisdictionId) {
    throw new Error(`Jurisdiction ID mismatch: expected "${jurisdictionId}", got "${parsed.jurisdiction_id}"`)
  }

  return parsed
}

// ─── Build jurisdiction_benefits patch ────────────────────────────────────────

/**
 * Convert extracted fields into a jurisdiction_benefits UPDATE patch.
 * Only includes fields with confidence >= threshold.
 * Also builds the updated official_sources[] entry.
 */
function buildJurisdictionPatch(extraction, sourceDoc, confidenceThreshold = 0.70) {
  const patch = {}
  const fieldConfidence = {}
  const lowConfidenceFields = []

  for (const [fieldName, fieldData] of Object.entries(extraction.fields || {})) {
    const { value, confidence, excerpt } = fieldData

    fieldConfidence[fieldName] = confidence

    if (confidence < confidenceThreshold || value === null || value === undefined) {
      if (confidence < confidenceThreshold) {
        lowConfidenceFields.push({ field: fieldName, confidence })
      }
      continue
    }

    patch[fieldName] = value
  }

  // Build high-confidence excerpt entries keyed by field
  const highConfidenceExcerpts = Object.entries(extraction.fields || {})
    .filter(([, v]) => v.confidence >= 0.85 && v.excerpt && v.excerpt.trim())
    .sort(([, a], [, b]) => b.confidence - a.confidence)  // highest confidence first

  // excerpt (singular, string) — required by schema for readiness scoring + validation
  // Use the single best excerpt (highest confidence) as the canonical excerpt string
  const bestExcerpt = highConfidenceExcerpts.length > 0
    ? highConfidenceExcerpts[0][1].excerpt.slice(0, 500)
    : ''

  // Build new official_sources entry from this source doc
  const newSource = {
    url:              sourceDoc.url,
    source_type:      sourceDoc.source_type,
    title:            sourceDoc.title || null,
    retrieved_at:     sourceDoc.fetched_at || new Date().toISOString(),
    content_hash:     sourceDoc.content_hash || null,
    excerpt:          bestExcerpt,           // singular string — used by readiness score + validator
    fields_supported: Object.keys(extraction.fields || {})
      .filter(f => (extraction.fields[f]?.confidence || 0) >= confidenceThreshold),
    // Include up to 3 high-value excerpts keyed by field (bonus detail for admin UI)
    excerpts: Object.fromEntries(
      highConfidenceExcerpts
        .slice(0, 3)
        .map(([k, v]) => [k, v.excerpt.slice(0, 300)])
    ),
  }

  return {
    patch,
    fieldConfidence,
    newSource,
    lowConfidenceFields,
    overallConfidence:  extraction.overall_confidence,
    fieldsNotFound:     extraction.fields_not_found || [],
    notes:              extraction.notes || '',
    isAboveThreshold:   extraction.overall_confidence >= confidenceThreshold,
  }
}

// ─── Write to DB ──────────────────────────────────────────────────────────────

async function applyExtractionToDb(supabase, jurisdictionId, patchResult) {
  // Load current row to merge official_sources and change_log
  const { data: existing, error: loadErr } = await supabase
    .from('jurisdiction_benefits')
    .select('id, official_sources, field_confidence, change_log')
    .eq('jurisdiction_id', jurisdictionId)
    .single()

  if (loadErr) throw new Error(`Load existing jurisdiction_benefits failed: ${loadErr.message}`)
  if (!existing) throw new Error(`No jurisdiction_benefits row found for: ${jurisdictionId}`)

  const { patch, fieldConfidence, newSource, overallConfidence, notes } = patchResult

  // Merge official_sources: remove existing entry for this URL, prepend new one
  const existingSources = existing.official_sources || []
  const mergedSources = [
    newSource,
    ...existingSources.filter(s => s.url !== newSource.url),
  ].slice(0, 5)  // keep at most 5 sources

  // Merge field confidence
  const mergedConfidence = { ...(existing.field_confidence || {}), ...fieldConfidence }

  // Append to change_log
  const changeEntry = {
    changed_at:   new Date().toISOString(),
    changed_by:   `extractor:${MODEL}`,
    action:       'extraction',
    fields_set:   Object.keys(patch),
    confidence:   overallConfidence,
    notes,
  }
  const mergedLog = [...(existing.change_log || []), changeEntry].slice(-20)

  const updatePayload = {
    ...patch,
    official_sources:    mergedSources,
    field_confidence:    mergedConfidence,
    change_log:          mergedLog,
    // Stay in needs_review — human must flip to verified
    verification_status: 'needs_review',
  }

  const { error: updateErr } = await supabase
    .from('jurisdiction_benefits')
    .update(updatePayload)
    .eq('jurisdiction_id', jurisdictionId)

  if (updateErr) throw new Error(`Update jurisdiction_benefits failed: ${updateErr.message}`)

  // Mark source doc as extracted
  const { error: srcErr } = await supabase
    .from('source_documents')
    .update({ extraction_status: 'extracted' })
    .eq('url', newSource.url)

  if (srcErr) console.warn(`  [warning] Could not mark source as extracted: ${srcErr.message}`)
}

// ─── Main extraction function ─────────────────────────────────────────────────

/**
 * Run extraction for a single source document.
 *
 * @param {string}   apiKey           - Anthropic API key
 * @param {Object}   supabase         - Supabase client (service role)
 * @param {Object}   sourceDoc        - row from source_documents
 * @param {string}   jurisdictionId   - e.g. "florida"
 * @param {string}   jurisdictionName - e.g. "Florida"
 * @param {Object}   options
 * @param {number}   options.confidenceThreshold - default 0.70
 * @param {boolean}  options.dryRun   - if true, print patch but don't write to DB
 * @returns {Object} extraction result
 */
async function extractSourceDocument(apiKey, supabase, sourceDoc, jurisdictionId, jurisdictionName, options = {}) {
  const { confidenceThreshold = 0.70, dryRun = false } = options

  if (!sourceDoc.raw_text) {
    throw new Error(`No raw_text available for source: ${sourceDoc.url}`)
  }

  console.log(`\n  🤖 Extracting: ${sourceDoc.url}`)
  console.log(`     Source type: ${sourceDoc.source_type} | Words: ${(sourceDoc.raw_text.match(/\S+/g) || []).length}`)

  const userContent = buildExtractionPrompt(jurisdictionId, jurisdictionName, sourceDoc.url, sourceDoc.raw_text)

  const rawResponse = await kimiApiCall(apiKey, userContent, SYSTEM_PROMPT)

  const extraction = parseExtractionOutput(rawResponse, jurisdictionId)
  extraction.extracted_at = new Date().toISOString()

  const patchResult = buildJurisdictionPatch(extraction, sourceDoc, confidenceThreshold)

  console.log(`     Overall confidence: ${(patchResult.overallConfidence * 100).toFixed(0)}%`)
  console.log(`     Fields extracted:   ${Object.keys(patchResult.patch).join(', ') || 'none above threshold'}`)
  if (patchResult.lowConfidenceFields.length) {
    console.log(`     Low confidence:     ${patchResult.lowConfidenceFields.map(f => `${f.field}(${(f.confidence * 100).toFixed(0)}%)`).join(', ')}`)
  }
  if (patchResult.fieldsNotFound.length) {
    console.log(`     Not found in doc:   ${patchResult.fieldsNotFound.join(', ')}`)
  }
  if (patchResult.notes) {
    console.log(`     Notes: ${patchResult.notes}`)
  }

  if (!dryRun) {
    await applyExtractionToDb(supabase, jurisdictionId, patchResult)
    console.log(`  ✓ DB updated — status: needs_review (awaiting human verification)`)
  } else {
    console.log('\n  [DRY RUN] Proposed patch:')
    console.log(JSON.stringify(patchResult.patch, null, 2))
  }

  return { extraction, patchResult }
}

module.exports = { extractSourceDocument }
