import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { requireInternalKey } from "../_shared/auth.ts"
import {
  buildDirectoryLink,
  buildLocationLabel,
  getStateName,
  normalizeStateAbbr,
} from "../_shared/coupleSubscription.ts"

/**
 * Couple Drip Emails — runs daily via GitHub Actions.
 *
 * Day 3: "Here are X counselors near you" — personalized by location + interest
 * Day 7: "Did you know you can save on your marriage license?" — if applicable state
 *
 * Uses drip_day3_sent_at and drip_day7_sent_at columns for idempotency.
 */

const DISCOUNT_STATES: Record<string, { discount: string; link: string }> = {
  'FL': { discount: '$32.50', link: '/premarital-counseling/marriage-license-discount/florida' },
  'GA': { discount: '$12.50', link: '/premarital-counseling/marriage-license-discount/georgia' },
  'MD': { discount: '$5', link: '/premarital-counseling/marriage-license-discount/maryland' },
  'MN': { discount: '$25', link: '/premarital-counseling/marriage-license-discount/minnesota' },
  'OK': { discount: '$17.50', link: '/premarital-counseling/marriage-license-discount/oklahoma' },
  'SC': { discount: '$25', link: '/premarital-counseling/marriage-license-discount/south-carolina' },
  'TN': { discount: '$60', link: '/premarital-counseling/marriage-license-discount/tennessee' },
  'TX': { discount: '$60', link: '/premarital-counseling/marriage-license-discount/texas' },
}

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
  let sent = 0
  let skipped = 0
  const errors: string[] = []

  // Get all subscribers who haven't unsubscribed
  const { data: subscribers, error: fetchErr } = await supabase
    .from('couple_subscribers')
    .select('*')
    .is('unsubscribed_at', null)
    .not('guide_sent_at', 'is', null) // only people who got the guide

  if (fetchErr || !subscribers) {
    return new Response(JSON.stringify({ error: fetchErr?.message || 'No subscribers' }), { status: 500 })
  }

  for (const sub of subscribers) {
    const createdAt = new Date(sub.created_at)
    const daysSinceSignup = (now.getTime() - createdAt.getTime()) / 86400000
    const firstName = sub.first_name || 'there'
    const locationStr = buildLocationLabel(sub.city, sub.state)
    const stateAbbr = normalizeStateAbbr(sub.state)
    const stateName = getStateName(sub.state) || sub.state || 'your state'
    const normalizedCity = typeof sub.city === 'string' ? sub.city.trim() || null : null

    // --- DAY 3: Personalized counselor recommendations ---
    if (daysSinceSignup >= 3 && !sub.drip_day3_sent_at) {
      const directoryLink = buildDirectoryLink(normalizedCity, stateAbbr)

      // Count providers in their area
      let providerCount = 0
      const buildProfileCountQuery = () => supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_hidden', false)
          .in('moderation_status', ['approved'])

      if (stateAbbr) {
        if (normalizedCity) {
          const { count: cityCount } = await buildProfileCountQuery()
            .eq('state_province', stateAbbr)
            .ilike('city', normalizedCity)

          providerCount = cityCount || 0
        }

        if (!providerCount) {
          const { count: stateCount } = await buildProfileCountQuery()
            .eq('state_province', stateAbbr)

          providerCount = stateCount || 0
        }
      }

      const interestMsg = sub.interest === 'officiant'
        ? 'wedding officiants'
        : sub.interest === 'both'
          ? 'premarital counselors and wedding officiants'
          : 'premarital counselors'

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="padding: 32px 24px;">
            <h2 style="color: #0d9488; margin: 0 0 16px; font-size: 20px;">
              ${firstName}, we found ${interestMsg} near you
            </h2>

            <p style="font-size: 15px; line-height: 1.7; margin-bottom: 16px;">
              ${providerCount > 0
                ? `There are <strong>${providerCount}+ ${interestMsg}</strong> in our directory near ${locationStr}. Each one has been verified for active licensure or ordination.`
                : `We're growing our directory of ${interestMsg} near ${locationStr}. In the meantime, you can browse professionals across all 50 states.`
              }
            </p>

            <p style="font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
              Here's what to look for when choosing:
            </p>

            <ul style="font-size: 14px; line-height: 1.8; color: #374151; padding-left: 20px; margin-bottom: 24px;">
              <li><strong>Credentials matter.</strong> Look for LMFT, LPC, LCSW, or ordained clergy with formal training.</li>
              <li><strong>Ask about their approach.</strong> Gottman, Prepare/Enrich, SYMBIS — different methods suit different couples.</li>
              <li><strong>Book a free consultation.</strong> Most offer a 15-minute call. Use it to see if the fit feels right.</li>
              <li><strong>Don't wait.</strong> The best counselors book 4-6 weeks out, especially during wedding season.</li>
            </ul>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${directoryLink}" style="display: inline-block; padding: 14px 28px; background: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Browse ${providerCount > 0 ? providerCount + '+ ' : ''}Counselors Near You
              </a>
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

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Wedding Counselors <hello@weddingcounselors.com>',
            to: [sub.email],
            subject: `${firstName}, here are ${interestMsg} near ${locationStr}`,
            html,
          }),
        })

        if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)

        await supabase.from('couple_subscribers')
          .update({ drip_day3_sent_at: now.toISOString() })
          .eq('email', sub.email)

        sent++
        await new Promise(r => setTimeout(r, 600))
      } catch (err) {
        errors.push(`Day3 ${sub.email}: ${err.message}`)
      }
      continue // don't send day 7 in same run
    }

    // --- DAY 7: Marriage license discount (if applicable state) ---
    if (daysSinceSignup >= 7 && !sub.drip_day7_sent_at && sub.drip_day3_sent_at) {
      const discountInfo = stateAbbr ? DISCOUNT_STATES[stateAbbr] : null

      let html: string
      let subject: string

      if (discountInfo) {
        // They're in a discount state — lead with the savings
        subject = `${firstName}, save ${discountInfo.discount} on your ${stateName} marriage license`
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="padding: 32px 24px;">
              <h2 style="color: #0d9488; margin: 0 0 16px; font-size: 20px;">
                Did you know? Save ${discountInfo.discount} on your marriage license.
              </h2>

              <p style="font-size: 15px; line-height: 1.7; margin-bottom: 16px;">
                ${firstName}, ${stateName} is one of eight states that reduces your marriage license fee when you complete premarital counseling.
                That's <strong>${discountInfo.discount} back in your pocket</strong> — and for many couples, it covers most or all of the counseling cost.
              </p>

              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #0d9488;">${discountInfo.discount}</div>
                <div style="font-size: 14px; color: #666; margin-top: 4px;">marriage license discount in ${stateName}</div>
              </div>

              <p style="font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
                To qualify, you just need to complete a premarital counseling program with a licensed or approved provider. Your counselor gives you a certificate, and you present it at the county clerk's office.
              </p>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${BASE}${discountInfo.link}" style="display: inline-block; padding: 14px 28px; background: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  See ${stateName} Discount Details
                </a>
              </div>

              <p style="font-size: 13px; color: #6b7280;">The Wedding Counselors Team</p>
            </div>
            <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
              <a href="${BASE}" style="color: #6b7280;">WeddingCounselors.com</a> &middot;
              <a href="${BASE}/unsubscribe" style="color: #6b7280;">Unsubscribe</a>
            </div>
          </div>
        `
      } else {
        // Not in a discount state — share general value
        subject = `${firstName}, one more thing before you choose a counselor`
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="padding: 32px 24px;">
              <h2 style="color: #0d9488; margin: 0 0 16px; font-size: 20px;">
                The one thing most couples forget
              </h2>

              <p style="font-size: 15px; line-height: 1.7; margin-bottom: 16px;">
                ${firstName}, here's what we hear from couples who waited too long to book: <em>"We didn't realize the best counselors fill up months in advance."</em>
              </p>

              <p style="font-size: 15px; line-height: 1.7; margin-bottom: 16px;">
                If your wedding is within the next 6 months, now is the time to start. Most premarital programs run 6-8 sessions over 2-3 months.
              </p>

              <p style="font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
                And did you know? <strong>Eight states offer a marriage license discount</strong> when you complete premarital counseling — saving you $25 to $60.
              </p>

              <div style="text-align: center; margin-bottom: 16px;">
                <a href="${BASE}/premarital-counseling/marriage-license-discount" style="display: inline-block; padding: 14px 28px; background: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  Check If Your State Qualifies
                </a>
              </div>

              <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
                This is our last scheduled email. If you ever need us, we're at hello@weddingcounselors.com.<br><br>
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

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Wedding Counselors <hello@weddingcounselors.com>',
            to: [sub.email],
            subject,
            html,
          }),
        })

        if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)

        await supabase.from('couple_subscribers')
          .update({ drip_day7_sent_at: now.toISOString() })
          .eq('email', sub.email)

        sent++
        await new Promise(r => setTimeout(r, 600))
      } catch (err) {
        errors.push(`Day7 ${sub.email}: ${err.message}`)
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    total_subscribers: subscribers.length,
    sent,
    skipped,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
