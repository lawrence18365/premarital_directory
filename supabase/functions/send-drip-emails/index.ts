import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { requireInternalKey } from "../_shared/auth.ts"

/**
 * Welcome Drip Email Sequence
 *
 * Runs daily via GitHub Actions. Sends timed follow-up emails to new professionals:
 *
 * Step 1 (Day 2):  "Finish your profile" - nudge to complete profile
 * Step 2 (Day 7):  "Your first week" - visibility recap with view stats
 * Step 3 (Day 14): "Getting more inquiries" - tips for profile optimization
 *
 * Drip type is determined by profile source:
 * - 'welcome' for organic signups (created via CreateProfilePage)
 * - 'claim_welcome' for claimed profiles (claimed via ClaimWithTokenPage)
 *
 * Uses drip_email_log for idempotency (UNIQUE on profile_id, drip_type, step).
 */

interface DripStep {
  step: number
  daysAfter: number
  subject: (name: string) => string
  html: (profile: any, stats: any) => string
}

const DRIP_STEPS: DripStep[] = [
  {
    step: 1,
    daysAfter: 2,
    subject: (name) => `${name}, a quick tip to get more couples`,
    html: (profile, _stats) => generateStep1HTML(profile),
  },
  {
    step: 2,
    daysAfter: 7,
    subject: (_name) => `Your first week on Wedding Counselors`,
    html: (profile, stats) => generateStep2HTML(profile, stats),
  },
  {
    step: 3,
    daysAfter: 14,
    subject: (_name) => `How to get more inquiries from couples`,
    html: (profile, _stats) => generateStep3HTML(profile),
  },
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

  let body: Record<string, any> = {}
  try { body = await req.json() } catch { /* ok */ }
  const testMode = body.test_mode || false
  const testEmail = body.test_email || null

  const now = new Date()

  try {
    // Get profiles created in the last 30 days (drip window)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, city, state_province, slug, created_at, claimed_at, is_claimed, photo_url, bio, specialties, certifications, faith_tradition, email_preferences')
      .eq('is_hidden', false)
      .eq('moderation_status', 'approved')
      .not('email', 'is', null)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (profilesError) throw profilesError
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No recent profiles' }))
    }

    // Get do_not_contact list
    const { data: dncList } = await supabase
      .from('do_not_contact')
      .select('email')
    const dncEmails = new Set((dncList || []).map(d => d.email.toLowerCase()))

    // Get all drip logs for these profiles
    const profileIds = profiles.map(p => p.id)
    const { data: dripLogs } = await supabase
      .from('drip_email_log')
      .select('profile_id, drip_type, step')
      .in('profile_id', profileIds)

    // Build sent steps map: profileId -> Set of sent steps
    const sentSteps: Record<string, Set<number>> = {}
    for (const log of (dripLogs || [])) {
      if (!sentSteps[log.profile_id]) sentSteps[log.profile_id] = new Set()
      sentSteps[log.profile_id].add(log.step)
    }

    // Get view stats for step 2 (first week recap)
    const { data: clicks } = await supabase
      .from('profile_clicks')
      .select('profile_id')
      .in('profile_id', profileIds)

    const viewCounts: Record<string, number> = {}
    for (const c of (clicks || [])) {
      viewCounts[c.profile_id] = (viewCounts[c.profile_id] || 0) + 1
    }

    let sent = 0
    let skipped = 0
    const errors: string[] = []

    for (const profile of profiles) {
      // Skip DNC
      if (dncEmails.has(profile.email.toLowerCase())) { skipped++; continue }

      // Check email preference
      const prefs = profile.email_preferences || {}
      if (prefs.marketing === false) { skipped++; continue }

      const profileSentSteps = sentSteps[profile.id] || new Set()
      const referenceDate = new Date(profile.claimed_at || profile.created_at)
      const daysSinceCreation = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
      const dripType = profile.is_claimed ? 'claim_welcome' : 'welcome'

      for (const dripStep of DRIP_STEPS) {
        // Check timing
        if (daysSinceCreation < dripStep.daysAfter) continue
        // Don't send steps that are way too late (more than 3 days past threshold)
        if (daysSinceCreation > dripStep.daysAfter + 3) continue
        // Check idempotency
        if (profileSentSteps.has(dripStep.step)) continue

        const stats = { totalViews: viewCounts[profile.id] || 0 }
        const html = dripStep.html(profile, stats)
        const subject = dripStep.subject(profile.full_name?.split(',')[0]?.split(' ')[0] || 'there')
        const recipient = testMode && testEmail ? testEmail : profile.email

        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Wedding Counselors <hello@weddingcounselors.com>',
              to: [recipient],
              subject,
              html,
            }),
          })

          if (!response.ok) {
            const errText = await response.text()
            throw new Error(`Resend ${response.status}: ${errText}`)
          }

          const result = await response.json()

          // Log for idempotency
          await supabase.from('drip_email_log').insert({
            profile_id: profile.id,
            drip_type: dripType,
            step: dripStep.step,
            email_id: result.id,
          })

          sent++

          // Rate limit
          if (sent % 8 === 0) {
            await new Promise(r => setTimeout(r, 1000))
          }
        } catch (err) {
          errors.push(`${profile.email} step ${dripStep.step}: ${err.message}`)
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
    console.error('Drip email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// ---- Email Templates ----

const BASE_URL = 'https://www.weddingcounselors.com'

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

const buttonStyle = 'display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;'

// Step 1 (Day 2): Complete your profile
function generateStep1HTML(profile: any): string {
  const firstName = profile.full_name?.split(',')[0]?.split(' ')[0] || 'there'
  const editUrl = `${BASE_URL}/professional/profile/edit`

  // Calculate what's missing
  const missing: string[] = []
  if (!profile.photo_url) missing.push('Professional photo (3x more views)')
  if (!profile.bio || profile.bio.length < 150) missing.push('Detailed bio (150+ words)')
  if (!profile.specialties || profile.specialties.length < 3) missing.push('3+ specialties')
  if (!profile.certifications || profile.certifications.length === 0) missing.push('Certifications')
  if (!profile.faith_tradition) missing.push('Faith tradition')

  const content = `
    <div style="padding: 24px;">
      <p style="font-size: 15px;">Hi ${firstName},</p>
      <p style="font-size: 15px;">Quick tip: counselors with complete profiles get significantly more inquiries from couples.</p>

      ${missing.length > 0 ? `
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #0d9488;">
          <p style="margin: 0 0 8px; font-weight: 600;">Your top priorities:</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
            ${missing.slice(0, 3).map(m => `<li style="margin-bottom: 4px;">${m}</li>`).join('')}
          </ul>
        </div>
      ` : `
        <p style="color: #0d9488; font-weight: 600;">Your profile is looking great!</p>
      `}

      <p style="text-align: center; margin: 24px 0;">
        <a href="${editUrl}" style="${buttonStyle}">Update Your Profile</a>
      </p>

      <p style="font-size: 14px; color: #6b7280;">Takes about 5 minutes. Couples in ${profile.city} are searching now.</p>
    </div>
  `

  return wrapEmail(content, profile.id)
}

// Step 2 (Day 7): First week recap
function generateStep2HTML(profile: any, stats: any): string {
  const firstName = profile.full_name?.split(',')[0]?.split(' ')[0] || 'there'
  const dashboardUrl = `${BASE_URL}/professional/dashboard`

  const content = `
    <div style="padding: 24px;">
      <p style="font-size: 15px;">Hi ${firstName},</p>
      <p style="font-size: 15px;">You've been on Wedding Counselors for a week! Here's a quick update:</p>

      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <div style="font-size: 32px; font-weight: 700; color: #7c3aed;">${stats.totalViews}</div>
        <div style="font-size: 14px; color: #6b7280;">profile view${stats.totalViews !== 1 ? 's' : ''} so far</div>
      </div>

      ${stats.totalViews > 0 ? `
        <p style="font-size: 15px;">
          Couples in ${profile.city} are finding you. Keep your profile updated to convert views into inquiries.
        </p>
      ` : `
        <p style="font-size: 15px;">
          As more couples discover the directory, your views will grow. A complete profile with a photo ranks higher in search results.
        </p>
      `}

      <p style="text-align: center; margin: 24px 0;">
        <a href="${dashboardUrl}" style="${buttonStyle}">View Your Dashboard</a>
      </p>
    </div>
  `

  return wrapEmail(content, profile.id)
}

// Step 3 (Day 14): Tips for getting more inquiries
function generateStep3HTML(profile: any): string {
  const firstName = profile.full_name?.split(',')[0]?.split(' ')[0] || 'there'
  const editUrl = `${BASE_URL}/professional/profile/edit`

  const content = `
    <div style="padding: 24px;">
      <p style="font-size: 15px;">Hi ${firstName},</p>
      <p style="font-size: 15px;">Two weeks in! Here are the top things that help counselors on our platform get more inquiries:</p>

      <div style="margin: 16px 0;">
        <div style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <strong style="color: #0d9488;">1. Professional photo</strong>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0;">Profiles with photos get 3x more clicks. A friendly headshot works best.</p>
        </div>
        <div style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <strong style="color: #0d9488;">2. Detailed bio</strong>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0;">Write 150+ words about your approach. Couples want to know what to expect.</p>
        </div>
        <div style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <strong style="color: #0d9488;">3. Respond quickly</strong>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0;">Counselors who respond within 24 hours have 5x higher booking rates.</p>
        </div>
        <div style="padding: 12px 0;">
          <strong style="color: #0d9488;">4. Add specialties</strong>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0;">The more you fill out, the more searches you appear in.</p>
        </div>
      </div>

      <p style="text-align: center; margin: 24px 0;">
        <a href="${editUrl}" style="${buttonStyle}">Optimize Your Profile</a>
      </p>

      <p style="font-size: 14px; color: #6b7280;">
        Questions? Just reply to this email.
      </p>
    </div>
  `

  return wrapEmail(content, profile.id)
}
