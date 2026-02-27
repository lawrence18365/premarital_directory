import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { requireInternalKey } from "../_shared/auth.ts"

/**
 * Officiant Outreach Campaign — daily batch emails to wedding officiants
 *
 * Pulls up to BATCH_SIZE leads from provider_outreach where:
 *   - outreach_status = 'identified'
 *   - notes contains 'officiant-outreach'
 *   - email not on do_not_contact list
 *
 * Sends a personalized cold email with their city's directory link
 * and a link to /for-officiants. Updates status to 'emailed' after send.
 *
 * Triggered daily by GitHub Actions cron. Requires INTERNAL_API_KEY header.
 */

const BATCH_SIZE = 10
const CAMPAIGN_TAG = 'officiant-outreach'

const STATE_ABBREV_TO_SLUG: Record<string, string> = {
  'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas',
  'CA': 'california', 'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware',
  'FL': 'florida', 'GA': 'georgia', 'HI': 'hawaii', 'ID': 'idaho',
  'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa', 'KS': 'kansas',
  'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland',
  'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota', 'MS': 'mississippi',
  'MO': 'missouri', 'MT': 'montana', 'NE': 'nebraska', 'NV': 'nevada',
  'NH': 'new-hampshire', 'NJ': 'new-jersey', 'NM': 'new-mexico', 'NY': 'new-york',
  'NC': 'north-carolina', 'ND': 'north-dakota', 'OH': 'ohio', 'OK': 'oklahoma',
  'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode-island', 'SC': 'south-carolina',
  'SD': 'south-dakota', 'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah',
  'VT': 'vermont', 'VA': 'virginia', 'WA': 'washington', 'WV': 'west-virginia',
  'WI': 'wisconsin', 'WY': 'wyoming', 'DC': 'district-of-columbia',
}

function buildCityUrl(city: string, state: string): string {
  const stateSlug = STATE_ABBREV_TO_SLUG[state.toUpperCase()] || state.toLowerCase().replace(/\s+/g, '-')
  const citySlug = city.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
  return `https://www.weddingcounselors.com/premarital-counseling/${stateSlug}/${citySlug}`
}

function generateEmailHTML(data: {
  name: string
  city: string
  state: string
  cityUrl: string
}): string {
  const { name, city, state, cityUrl } = data
  const firstName = name.split(' ')[0] || 'Hi'
  const location = `${city}, ${state}`

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

      <p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px;">
        Hi ${firstName},
      </p>

      <p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px;">
        I run <a href="https://www.weddingcounselors.com" style="color: #0d9488; text-decoration: none; font-weight: 500;">WeddingCounselors.com</a> — a free directory of premarital counselors. I noticed you officiate weddings in ${location} and wanted to share something that might save you time.
      </p>

      <p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px;">
        If couples ever ask you for a counseling recommendation, here's a directory link for your area that you can bookmark or add to your welcome packet:
      </p>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <a href="${cityUrl}" style="color: #0d9488; font-weight: 600; font-size: 16px; text-decoration: none; word-break: break-all;">
          ${cityUrl.replace('https://www.', '')}
        </a>
        <p style="font-size: 13px; color: #666; margin-top: 8px; margin-bottom: 0;">
          Licensed therapists, certified coaches, and clergy in ${location}
        </p>
      </div>

      <p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px;">
        It's free — no login, no sign-up. Couples just browse and contact a counselor directly. It saves you from having to play referral matchmaker.
      </p>

      <p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px;">
        If you'd like to learn more, here's a quick overview: <a href="https://www.weddingcounselors.com/for-officiants" style="color: #0d9488; text-decoration: none; font-weight: 500;">weddingcounselors.com/for-officiants</a>
      </p>

      <p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px;">
        Happy to answer any questions — just hit reply.
      </p>

      <p style="color: #666; font-size: 14px; line-height: 1.5;">
        Best,<br>
        Lawrence<br>
        <span style="color: #999;">Founder, WeddingCounselors.com</span>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <p style="color: #9ca3af; font-size: 11px; line-height: 1.5;">
        You're receiving this one-time email because you're listed as a wedding officiant in ${location}.
        If you'd prefer not to hear from us, simply reply "unsubscribe" and we'll remove you immediately.
      </p>
    </div>
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const authCheck = requireInternalKey(req)
  if (!authCheck.ok) {
    return authCheck.response!
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const results: Array<{ email: string; status: string; error?: string }> = []

  // 1. Get batch of unsent officiant leads
  const { data: leads, error: fetchErr } = await supabase
    .from('provider_outreach')
    .select('id, email, name, website, city, state, notes')
    .eq('outreach_status', 'identified')
    .ilike('notes', `%${CAMPAIGN_TAG}%`)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!leads || leads.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No pending officiant leads to send. Campaign batch complete.',
      sent: 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Load do_not_contact list
  const { data: dncList } = await supabase
    .from('do_not_contact')
    .select('email')

  const dncEmails = new Set((dncList || []).map((r: { email: string }) => r.email.toLowerCase()))

  // 3. Send emails
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]
    const email = lead.email?.toLowerCase()

    // Rate limit: 600ms between sends (Resend 2/sec limit)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 600))
    }

    // Skip if no email or on DNC list
    if (!email) {
      results.push({ email: 'none', status: 'skipped' })
      continue
    }

    if (dncEmails.has(email)) {
      // Mark as unsubscribed so we don't retry
      await supabase
        .from('provider_outreach')
        .update({ outreach_status: 'unsubscribed', updated_at: new Date().toISOString() })
        .eq('id', lead.id)
      results.push({ email, status: 'skipped_dnc' })
      continue
    }

    const displayName = lead.name || 'there'
    const cityUrl = buildCityUrl(lead.city, lead.state)

    const html = generateEmailHTML({
      name: displayName,
      city: lead.city,
      state: lead.state,
      cityUrl,
    })

    const firstName = displayName.split(' ')[0]
    const subject = `Free premarital counseling directory link for your ${lead.city} couples`

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Lawrence at WeddingCounselors <hello@weddingcounselors.com>',
          to: [email],
          reply_to: 'hello@weddingcounselors.com',
          subject,
          html,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()

        // If bounced, mark accordingly
        if (errText.includes('bounced') || errText.includes('invalid')) {
          await supabase
            .from('provider_outreach')
            .update({ outreach_status: 'bounced', updated_at: new Date().toISOString() })
            .eq('id', lead.id)
        }

        results.push({ email, status: 'error', error: errText })
        continue
      }

      const resendResult = await res.json()

      // 4. Mark as emailed
      await supabase
        .from('provider_outreach')
        .update({
          outreach_status: 'emailed',
          emailed_at: new Date().toISOString(),
          last_contacted_at: new Date().toISOString(),
          contact_count: (lead as any).contact_count ? (lead as any).contact_count + 1 : 1,
          email_template_used: 'officiant_cold_v1',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      results.push({ email, status: 'sent' })
    } catch (err) {
      results.push({ email, status: 'error', error: String(err) })
    }
  }

  const sent = results.filter(r => r.status === 'sent').length
  const skipped = results.filter(r => r.status.startsWith('skipped')).length
  const errors = results.filter(r => r.status === 'error').length

  return new Response(JSON.stringify({
    success: true,
    batch_size: leads.length,
    sent,
    skipped,
    errors,
    details: results,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
