import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { requireInternalKey } from "../_shared/auth.ts"

/**
 * Engagement Milestone Emails
 *
 * Runs daily via GitHub Actions. Sends proof-of-value emails when claimed profiles
 * hit engagement milestones:
 *
 * - 5 profile views:   "Couples are finding you" with view count
 * - 15 profile views:  "You're gaining traction" with comparison stats
 * - First inquiry:     "You got your first lead!" celebration
 * - 5 inquiries:       "You're a top provider" with social proof
 *
 * Uses drip_email_log with drip_type='engagement' for idempotency.
 */

interface Milestone {
  key: string
  step: number
  check: (stats: ProfileStats) => boolean
  subject: (name: string, stats: ProfileStats) => string
  html: (profile: any, stats: ProfileStats) => string
}

interface ProfileStats {
  views: number
  reveals: number
  leads: number
}

const BASE_URL = 'https://www.weddingcounselors.com'

const buttonStyle = 'display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;'

const wrapEmail = (content: string, profileId: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto;">
    ${content}
    <div style="padding: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
      <p style="margin: 0;">
        <a href="${BASE_URL}" style="color: #6b7280;">WeddingCounselors.com</a> &middot;
        <a href="${BASE_URL}/api/unsubscribe?profile_id=${profileId}&type=marketing" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
`

const MILESTONES: Milestone[] = [
  {
    key: '5_views',
    step: 10, // steps 10-19 reserved for engagement milestones
    check: (stats) => stats.views >= 5,
    subject: (name) => `${name}, couples in your area are finding you`,
    html: (profile, stats) => {
      const firstName = profile.full_name?.split(',')[0]?.split(' ')[0] || 'there'
      return wrapEmail(`
        <div style="padding: 24px;">
          <p style="font-size: 15px;">Hi ${firstName},</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center;">
            <div style="font-size: 36px; font-weight: 700; color: #7c3aed;">${stats.views}</div>
            <div style="font-size: 14px; color: #6b7280;">couples have viewed your profile</div>
          </div>
          <p style="font-size: 15px;">
            Couples searching for premarital counseling in ${profile.city || 'your area'} are landing on your profile.
            A complete profile with detailed pricing and availability converts views into inquiries.
          </p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${BASE_URL}/professional/dashboard" style="${buttonStyle}">View Your Stats</a>
          </p>
        </div>
      `, profile.id)
    }
  },
  {
    key: '15_views',
    step: 11,
    check: (stats) => stats.views >= 15,
    subject: (name) => `${name}, you're gaining traction`,
    html: (profile, stats) => {
      const firstName = profile.full_name?.split(',')[0]?.split(' ')[0] || 'there'
      return wrapEmail(`
        <div style="padding: 24px;">
          <p style="font-size: 15px;">Hi ${firstName},</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center;">
            <div style="font-size: 36px; font-weight: 700; color: #0d9488;">${stats.views}</div>
            <div style="font-size: 14px; color: #6b7280;">profile views and counting</div>
          </div>
          <p style="font-size: 15px;">
            You're getting consistent visibility from couples in ${profile.city || 'your area'}.
            Counselors who add session pricing and respond to inquiries within 24 hours see significantly more bookings.
          </p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${BASE_URL}/professional/profile/edit" style="${buttonStyle}">Update Your Profile</a>
          </p>
        </div>
      `, profile.id)
    }
  },
  {
    key: 'first_lead',
    step: 12,
    check: (stats) => stats.leads >= 1,
    subject: (name) => `${name}, you got your first inquiry!`,
    html: (profile, stats) => {
      const firstName = profile.full_name?.split(',')[0]?.split(' ')[0] || 'there'
      return wrapEmail(`
        <div style="padding: 24px;">
          <p style="font-size: 15px;">Hi ${firstName},</p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center;">
            <div style="font-size: 24px;">A couple reached out to you!</div>
          </div>
          <p style="font-size: 15px;">
            A couple searching for premarital counseling found your profile and submitted an inquiry.
            Check your dashboard for details and respond as soon as possible — counselors who
            reply within a few hours have the highest booking rates.
          </p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${BASE_URL}/professional/leads" style="${buttonStyle}">View Your Leads</a>
          </p>
          <p style="font-size: 14px; color: #6b7280;">
            Your profile has ${stats.views} view${stats.views !== 1 ? 's' : ''} total.
            Keep it updated to keep the inquiries coming.
          </p>
        </div>
      `, profile.id)
    }
  },
  {
    key: '5_leads',
    step: 13,
    check: (stats) => stats.leads >= 5,
    subject: (name) => `${name}, you're a top provider in your area`,
    html: (profile, stats) => {
      const firstName = profile.full_name?.split(',')[0]?.split(' ')[0] || 'there'
      return wrapEmail(`
        <div style="padding: 24px;">
          <p style="font-size: 15px;">Hi ${firstName},</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center;">
            <div style="font-size: 36px; font-weight: 700; color: #0d9488;">${stats.leads}</div>
            <div style="font-size: 14px; color: #6b7280;">couple inquiries received</div>
          </div>
          <p style="font-size: 15px;">
            You're one of the most-contacted counselors in ${profile.city || 'your area'}.
            With ${stats.views} profile views and ${stats.leads} inquiries, couples are clearly
            connecting with your approach.
          </p>
          <p style="font-size: 15px;">
            We're working on premium features to help top providers like you stand out even more.
            Stay tuned — and keep doing what you're doing.
          </p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${BASE_URL}/professional/dashboard" style="${buttonStyle}">View Your Dashboard</a>
          </p>
        </div>
      `, profile.id)
    }
  }
]

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

  try {
    // Get all claimed, approved, non-hidden profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, city, state_province, is_claimed, email_preferences, marketing_opt_in')
      .eq('is_claimed', true)
      .eq('is_hidden', false)
      .eq('moderation_status', 'approved')
      .not('email', 'is', null)

    if (profilesError) throw profilesError
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No claimed profiles' }))
    }

    // Get DNC list
    const { data: dncList } = await supabase.from('do_not_contact').select('email')
    const dncEmails = new Set((dncList || []).map(d => d.email.toLowerCase()))

    const profileIds = profiles.map(p => p.id)

    // Get existing engagement drip logs
    const { data: dripLogs } = await supabase
      .from('drip_email_log')
      .select('profile_id, step')
      .eq('drip_type', 'engagement')
      .in('profile_id', profileIds)

    const sentSteps: Record<string, Set<number>> = {}
    for (const log of (dripLogs || [])) {
      if (!sentSteps[log.profile_id]) sentSteps[log.profile_id] = new Set()
      sentSteps[log.profile_id].add(log.step)
    }

    // Get view counts per profile
    const { data: clicks } = await supabase
      .from('profile_clicks')
      .select('profile_id')
      .in('profile_id', profileIds)

    const viewCounts: Record<string, number> = {}
    for (const c of (clicks || [])) {
      viewCounts[c.profile_id] = (viewCounts[c.profile_id] || 0) + 1
    }

    // Get lead counts per profile
    const { data: leads } = await supabase
      .from('profile_leads')
      .select('profile_id')
      .in('profile_id', profileIds)

    const leadCounts: Record<string, number> = {}
    for (const l of (leads || [])) {
      leadCounts[l.profile_id] = (leadCounts[l.profile_id] || 0) + 1
    }

    // Get reveal counts per profile
    const { data: reveals } = await supabase
      .from('contact_reveals')
      .select('profile_id')
      .in('profile_id', profileIds)

    const revealCounts: Record<string, number> = {}
    for (const r of (reveals || [])) {
      revealCounts[r.profile_id] = (revealCounts[r.profile_id] || 0) + 1
    }

    let sent = 0
    let skipped = 0
    const errors: string[] = []

    for (const profile of profiles) {
      if (dncEmails.has(profile.email.toLowerCase())) { skipped++; continue }

      const optedIn = profile.marketing_opt_in !== undefined
        ? profile.marketing_opt_in
        : (profile.email_preferences || {}).marketing !== false
      if (!optedIn) { skipped++; continue }

      const profileSent = sentSteps[profile.id] || new Set()
      const stats: ProfileStats = {
        views: viewCounts[profile.id] || 0,
        reveals: revealCounts[profile.id] || 0,
        leads: leadCounts[profile.id] || 0
      }

      for (const milestone of MILESTONES) {
        if (profileSent.has(milestone.step)) continue
        if (!milestone.check(stats)) continue

        const subject = milestone.subject(
          profile.full_name?.split(',')[0]?.split(' ')[0] || 'there',
          stats
        )
        const html = milestone.html(profile, stats)

        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Wedding Counselors <hello@weddingcounselors.com>',
              to: [profile.email],
              subject,
              html,
            }),
          })

          if (!response.ok) {
            const errText = await response.text()
            throw new Error(`Resend ${response.status}: ${errText}`)
          }

          const result = await response.json()

          await supabase.from('drip_email_log').insert({
            profile_id: profile.id,
            drip_type: 'engagement',
            step: milestone.step,
            email_id: result.id,
          })

          sent++
          await new Promise(r => setTimeout(r, 600))
        } catch (err) {
          errors.push(`${profile.email} milestone ${milestone.key}: ${err.message}`)
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      sent,
      skipped,
      total_profiles: profiles.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Engagement milestone error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
