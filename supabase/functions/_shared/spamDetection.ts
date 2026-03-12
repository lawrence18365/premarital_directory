/**
 * Shared spam detection for lead submission edge functions.
 *
 * Three layers:
 *   1. Honeypot — hidden field that bots auto-fill, humans never see.
 *   2. Timing — bots submit in < 2 s; real users take much longer.
 *   3. Gibberish scoring — random-case strings, consonant clusters, low vowel ratio.
 */

// ---------------------------------------------------------------------------
// Gibberish detection
// ---------------------------------------------------------------------------

/** Count case-direction changes inside a single word (e.g. "BaNC" → 3). */
function caseChangeRatio(word: string): number {
  if (word.length < 4) return 0
  let changes = 0
  for (let i = 1; i < word.length; i++) {
    const prevIsUpper = word[i - 1] !== word[i - 1].toLowerCase()
    const currIsUpper = word[i] !== word[i].toLowerCase()
    if (prevIsUpper !== currIsUpper) changes++
  }
  return changes / (word.length - 1)
}

/** True when a string looks like keyboard mashing / bot filler. */
function isGibberish(text: string): boolean {
  if (!text || text.length < 4) return false

  const words = text.split(/[\s&,\-]+/).filter((w) => w.length > 2)
  if (words.length === 0) return false

  for (const word of words) {
    // 5+ consecutive consonants is extremely rare in real names
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(word)) return true

    // Excessive case toggling (e.g. "BaNCNICiPTCKoSvm")
    if (word.length >= 5 && caseChangeRatio(word) > 0.55) return true

    // Very low vowel ratio — most languages need vowels
    if (word.length >= 5) {
      const vowels = (word.match(/[aeiou]/gi) || []).length
      if (vowels / word.length < 0.12) return true
    }
  }

  return false
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SpamCheckInput {
  /** Honeypot field value — must be empty for legit submissions. */
  honeypot?: string
  /** Milliseconds between form load and submit. */
  elapsedMs?: number
  /** Couple / person name(s). */
  name?: string
  /** Free-text message body. */
  message?: string
}

export interface SpamCheckResult {
  isSpam: boolean
  /** Comma-separated list of triggered signals. */
  reason?: string
  /** 0–100 score; ≥ 50 is treated as spam. */
  score: number
}

export function checkForSpam(input: SpamCheckInput): SpamCheckResult {
  const reasons: string[] = []

  // Honeypot filled → definite bot, short-circuit
  if (input.honeypot) {
    return { isSpam: true, reason: 'honeypot', score: 100 }
  }

  let score = 0

  // Submitted in under 2 seconds — almost certainly automated
  if (typeof input.elapsedMs === 'number' && input.elapsedMs < 2000) {
    score += 50
    reasons.push('too_fast')
  }

  // Gibberish name
  if (input.name && isGibberish(input.name)) {
    score += 50
    reasons.push('gibberish_name')
  }

  // Gibberish message
  if (input.message && isGibberish(input.message)) {
    score += 30
    reasons.push('gibberish_message')
  }

  return {
    isSpam: score >= 50,
    reason: reasons.length ? reasons.join(', ') : undefined,
    score,
  }
}

/**
 * Build a fake "success" response so bots don't know they were caught.
 * This prevents them from adapting their payloads.
 */
export function silentSpamResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ success: true, lead: { id: crypto.randomUUID() } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
