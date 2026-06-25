/**
 * scripts/email/replay-stuck-leads.mjs
 *
 * One-off recovery: real couple leads piled up undelivered because the
 * concierge edge function emailed from an unverified Resend subdomain
 * (updates.weddingcounselors.com → 403). This script pulls every stuck lead
 * (platform_leads email_delivery_status='failed' + profile_leads
 * delivery_status='pending'), emails them to the platform owner via Spacemail
 * SMTP (which is verified and working), and marks them delivered.
 *
 * Safe by default: DRY-RUN unless you pass --send.
 *
 *   node scripts/email/replay-stuck-leads.mjs          # preview
 *   node scripts/email/replay-stuck-leads.mjs --send   # deliver + mark delivered
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { verify, sendMail } from './mailer.mjs'

const SEND = process.argv.includes('--send')
const TO = 'hello@weddingcounselors.com'
const supabase = createClient(
  'https://bkjwctlolhoxhnoospwp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// Heuristic: skip obvious test/spam rows so we only forward real couples.
const isJunk = (l) => {
  const name = (l.couple_name || '').toLowerCase()
  const phone = (l.couple_phone || '').replace(/\D/g, '')
  if (name.includes('sample') || name.includes('test')) return true
  if (phone === '5551234567') return true
  return false
}

const esc = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))
const fmtDate = (iso) => (iso || '').slice(0, 10)

function card(l, kind) {
  const loc = [l.city, l.state || l.location].filter(Boolean).join(', ') || '—'
  return `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:14px;">
      <div style="font-size:16px;font-weight:700;color:#111827;">${esc(l.couple_name)} <span style="font-weight:400;color:#6b7280;font-size:13px;">· ${esc(loc)} · ${esc(fmtDate(l.created_at))}</span></div>
      <table style="font-size:14px;color:#374151;margin-top:8px;border-collapse:collapse;">
        <tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Email</td><td><a href="mailto:${esc(l.couple_email)}">${esc(l.couple_email)}</a></td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Phone</td><td>${esc(l.couple_phone || '—')}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Looking for</td><td>${esc(l.preference || '—')}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Timeline</td><td>${esc(l.timeline || '—')}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6b7280;vertical-align:top;">Message</td><td>${esc(l.message || '—')}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Source</td><td style="color:#9ca3af;font-size:12px;">${esc(l.source_url || l.source_page || kind)}</td></tr>
      </table>
    </div>`
}

function textCard(l) {
  const loc = [l.city, l.state || l.location].filter(Boolean).join(', ') || '—'
  return `• ${l.couple_name}  (${loc}, ${fmtDate(l.created_at)})
    Email: ${l.couple_email}
    Phone: ${l.couple_phone || '—'}
    Looking for: ${l.preference || '—'} | Timeline: ${l.timeline || '—'}
    Message: ${l.message || '—'}\n`
}

async function main() {
  process.stdout.write('Verifying Spacemail SMTP... ')
  await verify()
  console.log('OK')

  const { data: plAll } = await supabase
    .from('platform_leads')
    .select('*')
    .eq('email_delivery_status', 'failed')
    .order('created_at', { ascending: true })

  const { data: prlAll } = await supabase
    .from('profile_leads')
    .select('*')
    .eq('delivery_status', 'pending')
    .order('created_at', { ascending: true })

  const platform = (plAll || []).filter((l) => !isJunk(l))
  const profile = (prlAll || []).filter((l) => l.status !== 'spam' && !isJunk(l))
  const skipped = (plAll || []).length - platform.length + (prlAll || []).length - profile.length

  console.log(`Stuck concierge leads (platform_leads): ${platform.length} real (+${(plAll || []).length - platform.length} junk skipped)`)
  console.log(`Stuck direct leads (profile_leads):     ${profile.length} real`)
  console.log(`Total to recover: ${platform.length + profile.length}\n`)

  if (platform.length + profile.length === 0) {
    console.log('Nothing to recover.')
    return
  }

  const all = [...platform.map((l) => ['concierge', l]), ...profile.map((l) => ['direct', l])]
  for (const [, l] of all) process.stdout.write(textCard(l) + '\n')

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;color:#333;">
      <h2 style="color:#0d9488;">Recovered couple leads (${platform.length + profile.length})</h2>
      <p style="font-size:14px;line-height:1.6;color:#374151;">
        These real couples submitted inquiries that were never delivered — the concierge
        notifier was emailing from an unverified domain and silently 403'ing. They're sorted
        oldest → newest. Reach out and/or forward each to matching counselors.
      </p>
      <h3 style="margin-top:24px;color:#111827;">Concierge "Get Matched" requests (${platform.length})</h3>
      ${platform.map((l) => card(l, 'concierge')).join('')}
      ${profile.length ? `<h3 style="margin-top:24px;color:#111827;">Direct profile inquiries (${profile.length})</h3>${profile.map((l) => card(l, 'direct')).join('')}` : ''}
      <p style="font-size:12px;color:#9ca3af;margin-top:24px;">
        Recovered via replay-stuck-leads.mjs · going-forward delivery is fixed once the
        process-concierge-lead edge function is redeployed.
      </p>
    </div>`

  const text = `Recovered couple leads (${platform.length + profile.length})\n\n` + all.map(([, l]) => textCard(l)).join('\n')

  if (!SEND) {
    console.log('\n── DRY RUN ── add --send to deliver to', TO, 'and mark delivered.')
    return
  }

  console.log(`\nSending digest to ${TO}...`)
  const info = await sendMail({
    from: '"Wedding Counselors Leads" <hello@weddingcounselors.com>',
    to: TO,
    subject: `🔔 ${platform.length + profile.length} recovered couple leads (were undelivered)`,
    text,
    html,
  })
  console.log('Sent ✅ messageId:', info.messageId, '| accepted:', info.accepted)

  // Mark delivered so the retry cron leaves them alone.
  if (platform.length) {
    const ids = platform.map((l) => l.id)
    const { error } = await supabase
      .from('platform_leads')
      .update({ email_delivery_status: 'sent', email_delivery_error: null })
      .in('id', ids)
    console.log(error ? `platform_leads update ERROR: ${error.message}` : `Marked ${ids.length} platform_leads delivered`)
  }
  if (profile.length) {
    const ids = profile.map((l) => l.id)
    const { error } = await supabase
      .from('profile_leads')
      .update({ delivery_status: 'delivered' })
      .in('id', ids)
    console.log(error ? `profile_leads update ERROR: ${error.message}` : `Marked ${ids.length} profile_leads delivered`)
  }
  console.log(`\nSkipped ${skipped} junk/test/spam row(s).`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
