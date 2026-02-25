import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { requireInternalKey } from "../_shared/auth.ts"

/**
 * Badge/Backlink Campaign — one-time email to claimed providers
 *
 * Asks claimed providers (who have websites) to add their WeddingCounselors
 * profile link to their website. In return, they get:
 * - "Verified Provider" badge (visible to couples)
 * - Higher ranking in search results
 * - Mutual SEO benefit (we link to them, they link to us)
 *
 * Uses drip_email_log with drip_type='badge_campaign' for idempotency.
 * Requires INTERNAL_API_KEY header (called from admin or GH Actions).
 */

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
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const results: Array<{ email: string; status: string; error?: string }> = []

  // 1. Get all claimed, approved providers with websites
  const { data: providers, error: fetchErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, city, state_province, website, slug, badge_verified')
    .eq('is_claimed', true)
    .eq('moderation_status', 'approved')
    .eq('is_hidden', false)
    .not('website', 'is', null)
    .eq('badge_verified', false)

  if (fetchErr || !providers) {
    return new Response(JSON.stringify({ error: fetchErr?.message || 'No providers found' }), { status: 500 })
  }

  // 2. Check do_not_contact list
  const { data: dncList } = await supabase
    .from('do_not_contact')
    .select('email')

  const dncEmails = new Set((dncList || []).map((r: { email: string }) => r.email.toLowerCase()))

  // 3. Check who already got this email (idempotency)
  const { data: alreadySent } = await supabase
    .from('drip_email_log')
    .select('profile_id')
    .eq('drip_type', 'badge_campaign')
    .eq('step', 'backlink_ask')

  const sentIds = new Set((alreadySent || []).map((r: { profile_id: string }) => r.profile_id))

  for (const provider of providers) {
    const email = provider.email?.toLowerCase()

    // Skip: no email, on DNC list, or already sent
    if (!email || dncEmails.has(email) || sentIds.has(provider.id)) {
      results.push({ email: email || 'none', status: 'skipped' })
      continue
    }

    // 4. Get this provider's view count for personalization
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
    const { count: viewCount } = await supabase
      .from('profile_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', provider.id)
      .gte('created_at', thirtyDaysAgo)

    const views = viewCount || 0
    const firstName = provider.full_name?.split(' ')[0] || 'there'

    // Build profile URL
    const stateSlug = provider.state_province
      ? provider.state_province.toLowerCase().replace(/\s+/g, '-')
      : null
    const citySlug = provider.city
      ? provider.city.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      : null
    const profileUrl = stateSlug && citySlug && provider.slug
      ? `https://www.weddingcounselors.com/premarital-counseling/${stateSlug}/${citySlug}/${provider.slug}`
      : `https://www.weddingcounselors.com/profile/${provider.id}`

    const dashboardUrl = 'https://www.weddingcounselors.com/professional/dashboard'

    const html = generateBadgeCampaignHTML({
      firstName,
      fullName: provider.full_name,
      profileUrl,
      dashboardUrl,
      views,
      city: provider.city,
      state: provider.state_province,
    })

    // 5. Send via Resend
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Wedding Counselors <hello@weddingcounselors.com>',
          to: [email],
          reply_to: 'hello@weddingcounselors.com',
          subject: `${firstName}, your profile has been viewed ${views} times this month`,
          html,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        results.push({ email, status: 'error', error: errText })
        continue
      }

      // 6. Log for idempotency
      await supabase.from('drip_email_log').insert({
        profile_id: provider.id,
        drip_type: 'badge_campaign',
        step: 'backlink_ask',
        sent_at: new Date().toISOString(),
      })

      results.push({ email, status: 'sent' })
    } catch (err) {
      results.push({ email, status: 'error', error: String(err) })
    }
  }

  const sent = results.filter(r => r.status === 'sent').length
  const skipped = results.filter(r => r.status === 'skipped').length
  const errors = results.filter(r => r.status === 'error').length

  return new Response(JSON.stringify({
    total: providers.length,
    sent,
    skipped,
    errors,
    details: results,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

interface BadgeEmailData {
  firstName: string
  fullName: string
  profileUrl: string
  dashboardUrl: string
  views: number
  city: string | null
  state: string | null
}

function generateBadgeCampaignHTML(data: BadgeEmailData): string {
  const { firstName, profileUrl, dashboardUrl, views, city, state } = data
  const locationStr = city && state ? `${city}, ${state}` : 'your area'
  const viewsStr = views > 0
    ? `<strong>${views} couples</strong> have viewed your profile in the last 30 days`
    : `Couples in ${locationStr} are searching for premarital counselors on our directory`

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

      <h2 style="color: #0d9488; margin-bottom: 24px;">Hi ${firstName},</h2>

      <p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px;">
        Quick update on your WeddingCounselors.com profile: ${viewsStr}.
      </p>

      ${views > 0 ? `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 36px; font-weight: 700; color: #0d9488;">${views}</div>
        <div style="font-size: 14px; color: #666; margin-top: 4px;">profile views this month</div>
      </div>
      ` : ''}

      <p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px;">
        I wanted to share something that would help both of us: <strong>if you add a link to your WeddingCounselors profile on your website</strong> (your About page or a "Find Me On" section), two things happen:
      </p>

      <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 14px;">
          <strong style="color: #0d9488;">1. Your website ranks better on Google</strong>
          <p style="margin: 6px 0 0; line-height: 1.6; font-size: 14px; color: #555;">
            We already link to your website from your profile. When you link back, Google sees this as a trust signal between two relevant sites. This helps <em>your</em> site rank higher for searches like "premarital counseling ${locationStr}."
          </p>
        </div>
        <div style="margin-bottom: 14px;">
          <strong style="color: #0d9488;">2. You get our "Verified Provider" badge</strong>
          <p style="margin: 6px 0 0; line-height: 1.6; font-size: 14px; color: #555;">
            Once we confirm your link, your profile gets a visible "Verified Provider" badge. Verified providers rank higher in our directory and stand out to couples browsing counselors.
          </p>
        </div>
        <div>
          <strong style="color: #0d9488;">3. Couples trust you more</strong>
          <p style="margin: 6px 0 0; line-height: 1.6; font-size: 14px; color: #555;">
            When an engaged couple Googles your name, they'll see your professional website AND your verified WeddingCounselors profile. Two results instead of one. That credibility matters when they're choosing who to trust with their marriage prep.
          </p>
        </div>
      </div>

      <p style="margin-bottom: 20px; line-height: 1.7; font-size: 15px;">
        <strong>Here's your profile link to add:</strong>
      </p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-family: monospace; font-size: 13px; word-break: break-all; color: #0d9488;">
        ${profileUrl}
      </div>

      <p style="margin-bottom: 8px; line-height: 1.7; font-size: 14px; color: #555;">
        You can add it anywhere on your site — an "About" page, "Find Me" section, footer, or a "Directories" page. Once it's live, simply reply to this email and we'll verify it and activate your badge.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
          View Your Dashboard
        </a>
      </div>

      <p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px;">
        Thanks for being part of WeddingCounselors.com. We're building this directory to connect great counselors like you with couples who are serious about preparing for marriage.
      </p>

      <p style="color: #666; font-size: 14px; line-height: 1.5;">
        Best,<br>
        Lawrence<br>
        <span style="color: #999;">Founder, WeddingCounselors.com</span>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
        You're receiving this because you claimed your profile on WeddingCounselors.com.
        <a href="https://www.weddingcounselors.com/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
      </p>
    </div>
  `
}
