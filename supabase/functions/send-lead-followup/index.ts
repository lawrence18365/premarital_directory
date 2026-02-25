import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { requireInternalKey } from "../_shared/auth.ts"

/**
 * Lead Follow-Up Reminder System — runs daily via GitHub Actions.
 *
 * 48 hours: Nudges the provider — "You have an unanswered inquiry"
 * 72 hours: Reassures the couple — "We're following up for you"
 *           + suggests other providers in their area
 *
 * Only targets leads with:
 * - status = 'new' (provider hasn't updated it)
 * - delivery_status = 'delivered' (initial notification was sent)
 * - profile_id IS NOT NULL (matched leads only, not unmatched)
 *
 * Idempotency via provider_followup_sent_at and couple_followup_sent_at columns.
 */

const BASE = 'https://www.weddingcounselors.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const authCheck = requireInternalKey(req)
  if (!authCheck.ok) return authCheck.response!

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const now = new Date()
  let providerNudges = 0
  let coupleFollowups = 0
  let skipped = 0
  const errors: string[] = []

  try {
    // Find leads that are 48+ hours old, still in 'new' status, delivered successfully
    // Cap at 14 days old — beyond that, the lead is cold
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: leads, error: leadsError } = await supabase
      .from('profile_leads')
      .select(`
        id, created_at, profile_id, couple_name, couple_email, couple_phone,
        wedding_date, location, message, status, delivery_status,
        provider_followup_sent_at, couple_followup_sent_at
      `)
      .eq('status', 'new')
      .eq('delivery_status', 'delivered')
      .not('profile_id', 'is', null)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    if (leadsError) throw leadsError
    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({ success: true, provider_nudges: 0, couple_followups: 0, message: 'No leads need follow-up' }))
    }

    // Get do_not_contact list
    const { data: dncList } = await supabase
      .from('do_not_contact')
      .select('email')
    const dncEmails = new Set((dncList || []).map((d: any) => d.email.toLowerCase()))

    // Get all relevant profile data in one query
    const profileIds = [...new Set(leads.map(l => l.profile_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, city, state_province, slug, is_hidden, moderation_status, email_preferences')
      .in('id', profileIds)

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    for (const lead of leads) {
      const profile = profileMap.get(lead.profile_id)
      if (!profile || !profile.email) { skipped++; continue }
      if (profile.is_hidden || (profile.moderation_status && profile.moderation_status !== 'approved')) { skipped++; continue }

      const hoursSinceCreated = (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60)

      // --- 48-HOUR PROVIDER NUDGE ---
      if (hoursSinceCreated >= 48 && !lead.provider_followup_sent_at) {
        // Skip if provider is on DNC list or opted out of inquiry notifications
        if (dncEmails.has(profile.email.toLowerCase())) { skipped++; continue }
        const prefs = profile.email_preferences || {}
        if (prefs.inquiry_notifications === false) { skipped++; continue }

        const firstName = profile.full_name?.split(',')[0]?.split(' ')[0] || 'there'
        const coupleName = lead.couple_name || 'A couple'
        const inquiryRef = `INQ-${lead.id.slice(0, 8).toUpperCase()}`
        const daysAgo = Math.floor(hoursSinceCreated / 24)

        const html = generateProviderNudgeHTML(firstName, coupleName, inquiryRef, daysAgo, lead)

        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Wedding Counselors <leads@weddingcounselors.com>',
              to: [profile.email],
              subject: `Reminder: ${coupleName} is waiting to hear from you`,
              html,
              reply_to: lead.couple_email,
            }),
          })

          if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)

          await supabase.from('profile_leads')
            .update({ provider_followup_sent_at: now.toISOString() })
            .eq('id', lead.id)

          providerNudges++
          await new Promise(r => setTimeout(r, 600))
        } catch (err: any) {
          errors.push(`Provider nudge ${profile.email}: ${err.message}`)
        }
      }

      // --- 72-HOUR COUPLE REASSURANCE ---
      if (hoursSinceCreated >= 72 && lead.provider_followup_sent_at && !lead.couple_followup_sent_at) {
        // Skip if couple is on DNC list
        if (dncEmails.has(lead.couple_email.toLowerCase())) { skipped++; continue }

        const coupleFirstName = lead.couple_name?.split(' ')[0]?.split('&')[0]?.split('and')[0]?.trim() || 'there'
        const location = lead.location || (profile.city && profile.state_province ? `${profile.city}, ${profile.state_province}` : null)

        // Count other providers in the area for the suggestion
        let nearbyCount = 0
        if (profile.state_province) {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('is_hidden', false)
            .in('moderation_status', ['approved'])
            .eq('state_province', profile.state_province)
            .neq('id', profile.id)

          nearbyCount = count || 0
        }

        const stateSlug = profile.state_province
          ? getStateSlug(profile.state_province)
          : null
        const citySlug = profile.city
          ? profile.city.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
          : null
        const browseLink = stateSlug && citySlug
          ? `${BASE}/premarital-counseling/${stateSlug}/${citySlug}`
          : `${BASE}/premarital-counseling`

        const html = generateCoupleFollowupHTML(coupleFirstName, profile.full_name, nearbyCount, browseLink, location)

        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Wedding Counselors <hello@weddingcounselors.com>',
              to: [lead.couple_email],
              subject: `${coupleFirstName}, a quick update on your counselor inquiry`,
              html,
            }),
          })

          if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)

          await supabase.from('profile_leads')
            .update({ couple_followup_sent_at: now.toISOString() })
            .eq('id', lead.id)

          coupleFollowups++
          await new Promise(r => setTimeout(r, 600))
        } catch (err: any) {
          errors.push(`Couple followup ${lead.couple_email}: ${err.message}`)
        }
      }
    }

    // --- COMPUTE "RESPONDS QUICKLY" BADGE ---
    // For all profiles that have received leads in the last 30 days,
    // calculate response rate and update the responds_quickly flag
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentLeads } = await supabase
      .from('profile_leads')
      .select('profile_id, status')
      .not('profile_id', 'is', null)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (recentLeads && recentLeads.length > 0) {
      const respondedStatuses = new Set(['contacted', 'scheduled', 'converted', 'booked_elsewhere'])
      const excludedStatuses = new Set(['spam', 'duplicate'])

      // Group by profile_id
      const profileStats: Record<string, { eligible: number; responded: number }> = {}
      for (const lead of recentLeads) {
        if (excludedStatuses.has(lead.status)) continue
        if (!profileStats[lead.profile_id]) profileStats[lead.profile_id] = { eligible: 0, responded: 0 }
        profileStats[lead.profile_id].eligible++
        if (respondedStatuses.has(lead.status)) profileStats[lead.profile_id].responded++
      }

      // Batch update responds_quickly for profiles with leads
      const quickResponders: string[] = []
      const slowResponders: string[] = []

      for (const [profileId, stats] of Object.entries(profileStats)) {
        const rate = stats.eligible > 0 ? stats.responded / stats.eligible : 0
        if (stats.eligible >= 3 && rate >= 0.75) {
          quickResponders.push(profileId)
        } else {
          slowResponders.push(profileId)
        }
      }

      if (quickResponders.length > 0) {
        await supabase.from('profiles')
          .update({ responds_quickly: true })
          .in('id', quickResponders)
      }
      if (slowResponders.length > 0) {
        await supabase.from('profiles')
          .update({ responds_quickly: false })
          .in('id', slowResponders)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_leads_checked: leads.length,
      provider_nudges: providerNudges,
      couple_followups: coupleFollowups,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Lead follow-up error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// ---- State slug helper ----
const STATE_NAMES: Record<string, string> = {
  'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas', 'CA': 'california',
  'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware', 'FL': 'florida', 'GA': 'georgia',
  'HI': 'hawaii', 'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa',
  'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland',
  'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota', 'MS': 'mississippi', 'MO': 'missouri',
  'MT': 'montana', 'NE': 'nebraska', 'NV': 'nevada', 'NH': 'new-hampshire', 'NJ': 'new-jersey',
  'NM': 'new-mexico', 'NY': 'new-york', 'NC': 'north-carolina', 'ND': 'north-dakota', 'OH': 'ohio',
  'OK': 'oklahoma', 'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode-island', 'SC': 'south-carolina',
  'SD': 'south-dakota', 'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah', 'VT': 'vermont',
  'VA': 'virginia', 'WA': 'washington', 'WV': 'west-virginia', 'WI': 'wisconsin', 'WY': 'wyoming',
}

function getStateSlug(abbr: string): string | null {
  return STATE_NAMES[abbr.toUpperCase()] || null
}

// ---- Email Templates ----

function generateProviderNudgeHTML(
  firstName: string,
  coupleName: string,
  inquiryRef: string,
  daysAgo: number,
  lead: any
): string {
  const leadsUrl = `${BASE}/professional/leads`

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #fef3c7; padding: 16px 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <p style="margin: 0; font-size: 15px; font-weight: 600; color: #92400e;">
          Unanswered inquiry — ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago
        </p>
      </div>

      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 15px; margin-bottom: 16px;">
          Hi ${firstName},
        </p>

        <p style="font-size: 15px; line-height: 1.7; margin-bottom: 16px;">
          <strong>${coupleName}</strong> reached out to you ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago and hasn't heard back yet.
          Couples who get a response within 48 hours are <strong>5x more likely to book</strong>.
        </p>

        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">${inquiryRef}</p>
          <p style="margin: 0 0 4px;"><strong>${coupleName}</strong></p>
          ${lead.couple_email ? `<p style="margin: 0 0 4px; font-size: 14px;">${lead.couple_email}</p>` : ''}
          ${lead.wedding_date ? `<p style="margin: 0 0 4px; font-size: 14px;">Wedding: ${new Date(lead.wedding_date).toLocaleDateString()}</p>` : ''}
          ${lead.location ? `<p style="margin: 0; font-size: 14px;">Location: ${lead.location}</p>` : ''}
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="mailto:${lead.couple_email}?subject=Re: Premarital Counseling Inquiry" style="display: inline-block; padding: 14px 28px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Reply to ${coupleName}
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          Or <a href="${leadsUrl}" style="color: #0d9488;">manage this lead</a> from your dashboard
        </p>
      </div>

      <div style="padding: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
        <a href="${BASE}" style="color: #6b7280;">WeddingCounselors.com</a>
      </div>
    </div>
  `
}

function generateCoupleFollowupHTML(
  firstName: string,
  providerName: string,
  nearbyCount: number,
  browseLink: string,
  location: string | null
): string {
  const locationLabel = location || 'your area'

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="padding: 32px 24px;">
        <h2 style="color: #0d9488; margin: 0 0 16px; font-size: 20px;">
          ${firstName}, a quick update on your inquiry
        </h2>

        <p style="font-size: 15px; line-height: 1.7; margin-bottom: 16px;">
          We wanted to let you know that we've followed up with <strong>${providerName}</strong> about your inquiry.
          Some counselors take a few days to respond, especially during busy seasons.
        </p>

        <p style="font-size: 15px; line-height: 1.7; margin-bottom: 16px;">
          In the meantime, don't put your search on hold. The best counselors fill up fast, and
          reaching out to 2-3 providers is a smart way to find the right fit.
        </p>

        ${nearbyCount > 0 ? `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #0d9488;">${nearbyCount}+</div>
            <div style="font-size: 14px; color: #666; margin-top: 4px;">other counselors near ${locationLabel}</div>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 24px 0;">
          <a href="${browseLink}" style="display: inline-block; padding: 14px 28px; background: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Browse More Counselors
          </a>
        </div>

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">Tips for choosing the right counselor:</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #374151; line-height: 1.8;">
            <li>Book a free consultation — most counselors offer a 15-minute intro call</li>
            <li>Ask about their approach (Gottman, PREPARE/ENRICH, etc.)</li>
            <li>Make sure they're licensed (LMFT, LPC, LCSW) or properly credentialed</li>
          </ul>
        </div>

        <p style="font-size: 13px; color: #6b7280;">
          The Wedding Counselors Team
        </p>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
        <a href="${BASE}" style="color: #6b7280;">WeddingCounselors.com</a> &middot;
        <a href="${BASE}/unsubscribe" style="color: #6b7280;">Unsubscribe</a>
      </div>
    </div>
  `
}
