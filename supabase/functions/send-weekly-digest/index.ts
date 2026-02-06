import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { requireInternalKey } from "../_shared/auth.ts"

/**
 * Weekly Digest Email - sends profile stats to all active counselors
 *
 * Called by GitHub Actions cron (Monday 9 AM UTC).
 * Requires INTERNAL_API_KEY header.
 *
 * For each active, claimed, approved profile:
 * - Checks email_preferences.weekly_digest
 * - Checks do_not_contact
 * - Checks idempotency (digest_send_log)
 * - Queries views (7d/30d), inquiries (7d/30d), days listed
 * - Sends email via Resend
 * - Logs to digest_send_log
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  // Require internal API key - this is not a public endpoint
  const authCheck = requireInternalKey(req)
  if (!authCheck.ok) {
    return authCheck.response!
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Parse optional params
  let body: Record<string, any> = {}
  try { body = await req.json() } catch { /* no body is fine */ }
  const maxEmails = body.max_emails || 200
  const testMode = body.test_mode || false
  const testEmail = body.test_email || null

  // Calculate period: last 7 days (Monday to Sunday)
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setHours(0, 0, 0, 0)
  const periodStart = new Date(periodEnd)
  periodStart.setDate(periodStart.getDate() - 7)

  const periodStartStr = periodStart.toISOString().split('T')[0]
  const periodEndStr = periodEnd.toISOString().split('T')[0]

  try {
    // Get all active, claimed, approved profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, city, state_province, created_at, email_preferences')
      .eq('is_claimed', true)
      .eq('is_hidden', false)
      .eq('moderation_status', 'approved')
      .not('email', 'is', null)

    if (profilesError) throw profilesError
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No eligible profiles' }))
    }

    // Get do_not_contact list
    const { data: dncList } = await supabase
      .from('do_not_contact')
      .select('email')

    const dncEmails = new Set((dncList || []).map(d => d.email.toLowerCase()))

    // Get already-sent digests for this period
    const { data: alreadySent } = await supabase
      .from('digest_send_log')
      .select('profile_id')
      .eq('digest_type', 'weekly')
      .eq('period_start', periodStartStr)

    const alreadySentIds = new Set((alreadySent || []).map(d => d.profile_id))

    // Filter eligible profiles
    const eligible = profiles.filter(p => {
      // Check do_not_contact
      if (dncEmails.has(p.email.toLowerCase())) return false
      // Check already sent
      if (alreadySentIds.has(p.id)) return false
      // Check email preference (default to true if not set)
      const prefs = p.email_preferences || {}
      if (prefs.weekly_digest === false) return false
      return true
    })

    console.log(`Eligible profiles: ${eligible.length} of ${profiles.length} total`)

    // Get all profile clicks for the period
    const { data: clicks } = await supabase
      .from('profile_clicks')
      .select('profile_id, created_at')
      .gte('created_at', periodStart.toISOString())

    // Get all leads for the period
    const { data: leads } = await supabase
      .from('profile_leads')
      .select('profile_id, created_at')
      .gte('created_at', periodStart.toISOString())

    // Also get 30-day stats
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: clicks30d } = await supabase
      .from('profile_clicks')
      .select('profile_id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const { data: leads30d } = await supabase
      .from('profile_leads')
      .select('profile_id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Build lookup maps
    const viewsByProfile7d: Record<string, number> = {}
    const viewsByProfile30d: Record<string, number> = {}
    const leadsByProfile7d: Record<string, number> = {}
    const leadsByProfile30d: Record<string, number> = {}

    for (const c of (clicks || [])) {
      viewsByProfile7d[c.profile_id] = (viewsByProfile7d[c.profile_id] || 0) + 1
    }
    for (const c of (clicks30d || [])) {
      viewsByProfile30d[c.profile_id] = (viewsByProfile30d[c.profile_id] || 0) + 1
    }
    for (const l of (leads || [])) {
      leadsByProfile7d[l.profile_id] = (leadsByProfile7d[l.profile_id] || 0) + 1
    }
    for (const l of (leads30d || [])) {
      leadsByProfile30d[l.profile_id] = (leadsByProfile30d[l.profile_id] || 0) + 1
    }

    // Send emails
    let sent = 0
    let failed = 0
    const errors: string[] = []

    const toSend = eligible.slice(0, maxEmails)

    for (const profile of toSend) {
      const views7d = viewsByProfile7d[profile.id] || 0
      const views30d = viewsByProfile30d[profile.id] || 0
      const inquiries7d = leadsByProfile7d[profile.id] || 0
      const inquiries30d = leadsByProfile30d[profile.id] || 0
      const daysListed = Math.floor((now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))

      const stats = { views7d, views30d, inquiries7d, inquiries30d, daysListed }
      const html = generateDigestHTML(profile, stats)

      const recipient = testMode && testEmail ? testEmail : profile.email

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Wedding Counselors <digest@weddingcounselors.com>',
            to: [recipient],
            subject: views7d > 0
              ? `Your profile was viewed ${views7d} time${views7d !== 1 ? 's' : ''} this week`
              : `Your weekly profile update`,
            html,
          }),
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Resend ${response.status}: ${errText}`)
        }

        const result = await response.json()

        // Log to digest_send_log
        await supabase.from('digest_send_log').insert({
          profile_id: profile.id,
          digest_type: 'weekly',
          period_start: periodStartStr,
          period_end: periodEndStr,
          email_id: result.id,
          stats_snapshot: stats,
        })

        sent++

        // Small delay to respect Resend rate limits (10/sec on free tier)
        if (sent % 8 === 0) {
          await new Promise(r => setTimeout(r, 1000))
        }
      } catch (err) {
        failed++
        errors.push(`${profile.email}: ${err.message}`)
        console.error(`Failed to send digest to ${profile.email}:`, err.message)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      sent,
      failed,
      eligible: eligible.length,
      total_profiles: profiles.length,
      period: { start: periodStartStr, end: periodEndStr },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Weekly digest error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function generateDigestHTML(
  profile: { full_name: string; city: string; state_province: string; id: string },
  stats: { views7d: number; views30d: number; inquiries7d: number; inquiries30d: number; daysListed: number }
): string {
  const baseUrl = 'https://www.weddingcounselors.com'
  const dashboardUrl = `${baseUrl}/professional/dashboard`
  const editUrl = `${baseUrl}/professional/profile/edit`
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?profile_id=${profile.id}&type=weekly_digest`

  const hasActivity = stats.views7d > 0 || stats.inquiries7d > 0

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto;">
      <div style="background: #0d9488; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Your Weekly Profile Update</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px;">
          ${profile.full_name} &middot; ${profile.city}, ${profile.state_province}
        </p>
      </div>

      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <!-- Stats Grid -->
        <div style="display: flex; text-align: center; margin-bottom: 20px;">
          <div style="flex: 1; padding: 12px;">
            <div style="font-size: 28px; font-weight: 700; color: ${stats.views7d > 0 ? '#7c3aed' : '#9ca3af'};">
              ${stats.views7d}
            </div>
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
              Views this week
            </div>
          </div>
          <div style="flex: 1; padding: 12px; border-left: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6;">
            <div style="font-size: 28px; font-weight: 700; color: ${stats.inquiries7d > 0 ? '#0d9488' : '#9ca3af'};">
              ${stats.inquiries7d}
            </div>
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
              Inquiries this week
            </div>
          </div>
          <div style="flex: 1; padding: 12px;">
            <div style="font-size: 28px; font-weight: 700; color: #2563eb;">
              ${stats.daysListed}
            </div>
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
              Days listed
            </div>
          </div>
        </div>

        <!-- 30-day context -->
        <div style="background: #f9fafb; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
          <strong>Last 30 days:</strong> ${stats.views30d} view${stats.views30d !== 1 ? 's' : ''}, ${stats.inquiries30d} inquir${stats.inquiries30d !== 1 ? 'ies' : 'y'}
        </div>

        <!-- Contextual message -->
        ${hasActivity ? `
          <p style="margin: 0 0 20px; font-size: 15px;">
            ${stats.inquiries7d > 0
              ? `Couples in ${profile.city} are reaching out! Make sure to respond within 24 hours for the best conversion rate.`
              : `Your profile is getting views from couples in ${profile.city}. A complete profile with a photo and detailed bio converts views into inquiries.`
            }
          </p>
        ` : `
          <p style="margin: 0 0 20px; font-size: 15px;">
            Your profile is live and appearing in search results for premarital counseling in ${profile.city}.
            As more couples discover the directory, your views will grow.
          </p>
        `}

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 8px;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 28px; background: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
            View Dashboard
          </a>
        </div>
        <div style="text-align: center;">
          <a href="${editUrl}" style="color: #0d9488; text-decoration: underline; font-size: 14px;">
            Update your profile
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 16px 24px; font-size: 12px; color: #9ca3af; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; background: #f9fafb;">
        <p style="margin: 0 0 8px;">
          You're receiving this because you're listed on <a href="${baseUrl}" style="color: #6b7280;">WeddingCounselors.com</a>
        </p>
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from weekly updates</a>
      </div>
    </div>
  `
}
