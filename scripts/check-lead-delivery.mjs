/**
 * scripts/check-lead-delivery.mjs
 *
 * Daily guardrail: detect couple leads that failed or stalled in delivery, so a
 * broken pipe never silently costs us couples again (it did, for months).
 *
 * Checks the last 48h of platform_leads (email_delivery_status='failed') and
 * profile_leads (delivery_status in failed/pending). If any are found it logs
 * them, emails an alert to hello@ via Resend when RESEND_API_KEY is set, and
 * exits non-zero so the GitHub Actions run fails and notifies the owner.
 *
 * Uses the Supabase REST API via fetch, so it has ZERO npm dependencies.
 * Env: SUPABASE_SERVICE_ROLE_KEY (required), RESEND_API_KEY (optional).
 *   node --env-file=.env scripts/check-lead-delivery.mjs   # local
 */

const SUPABASE_URL = 'https://bkjwctlolhoxhnoospwp.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY
const ALERT_TO = 'hello@weddingcounselors.com'

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(2)
}

const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
const isTest = (n) => /sample|test/i.test(n || '')

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (!res.ok) {
    console.error(`REST query failed: ${res.status} ${await res.text()}`)
    process.exit(2)
  }
  return res.json()
}

async function main() {
  const s = encodeURIComponent(since)
  const platform = await rest(`platform_leads?email_delivery_status=eq.failed&created_at=gte.${s}&select=couple_name,couple_email,city,state,email_delivery_error&order=created_at.desc`)
  const profile = await rest(`profile_leads?delivery_status=in.(failed,pending)&created_at=gte.${s}&select=couple_name,couple_email,delivery_status,delivery_error&order=created_at.desc`)

  const stuckPlatform = platform.filter((l) => !isTest(l.couple_name))
  const stuckProfile = profile.filter((l) => !isTest(l.couple_name))
  const total = stuckPlatform.length + stuckProfile.length

  if (total === 0) {
    console.log('Lead delivery healthy: 0 failed or stalled leads in the last 48h.')
    return
  }

  const lines = [`${total} lead(s) failed or stalled in the last 48h:`]
  for (const l of stuckPlatform) {
    lines.push(`- [concierge] ${l.couple_name} (${[l.city, l.state].filter(Boolean).join(', ') || 'no location'}) ${l.couple_email} :: ${(l.email_delivery_error || '').slice(0, 140)}`)
  }
  for (const l of stuckProfile) {
    lines.push(`- [profile] ${l.couple_name} ${l.couple_email} :: ${l.delivery_status} ${(l.delivery_error || '').slice(0, 140)}`)
  }
  const body = lines.join('\n')
  console.error(body)

  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Wedding Counselors <hello@weddingcounselors.com>',
          to: ALERT_TO,
          subject: `Lead delivery alert: ${total} stuck lead(s)`,
          text: body + '\n\nCheck the process-concierge-lead and send-lead-notification edge functions.',
        }),
      })
      console.log(res.ok ? 'Alert email sent.' : `Alert email failed: ${res.status} ${await res.text()}`)
    } catch (err) {
      console.error('Alert email error:', err.message)
    }
  } else {
    console.log('RESEND_API_KEY not set; relying on the workflow failure notification.')
  }

  // Non-zero exit so the GitHub Actions run is marked failed and notifies the owner.
  process.exit(1)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(2) })
