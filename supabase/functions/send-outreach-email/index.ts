import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, requireInternalKey } from "../_shared/auth.ts"

/**
 * Outreach Email Function - FOR COLD OUTREACH ONLY
 * Includes all safety checks:
 * - Do not contact list enforcement
 * - Rate limiting
 * - Event logging for audit trail
 * - Uses monitored inbox for replies
 */

interface OutreachEmailRequest {
  provider_email: string
  provider_name: string
  profile_id: string
  claim_token: string
  template: 'initial_outreach' | 'claim_reminder'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    const internal = requireInternalKey(req)
    if (!internal.ok) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: internal.response?.status || 401, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const request: OutreachEmailRequest = await req.json()

    // SAFETY CHECK 1: Do not contact list
    const { data: dnc } = await supabase
      .from('do_not_contact')
      .select('email')
      .eq('email', request.provider_email)
      .single()

    if (dnc) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email is on do_not_contact list',
          reason: 'do_not_contact'
        }),
        { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    // SAFETY CHECK 2: Rate limiting
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('provider_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'email_sent')
      .gte('created_at', today)

    const { data: settings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'max_outreach_per_day')
      .single()

    const dailyLimit = settings?.value ? parseInt(settings.value) : 25

    if (count >= dailyLimit) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Daily outreach limit reached (${count}/${dailyLimit})`,
          reason: 'rate_limit'
        }),
        { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    // Generate email content
    const html = generateOutreachHTML(request)
    const subject = request.template === 'initial_outreach'
      ? `Your profile on Wedding Counselors - claim or remove`
      : `Reminder: Claim your Wedding Counselors profile`

    // IMPORTANT: Use monitored inbox for replies (outreach@, not noreply@)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wedding Counselors <outreach@weddingcounselors.com>',
        to: [request.provider_email],
        reply_to: 'hello@weddingcounselors.com',
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${response.status} - ${error}`)
    }

    const result = await response.json()

    // Log the send event for audit trail
    await supabase.from('provider_events').insert({
      provider_email: request.provider_email,
      profile_id: request.profile_id,
      event_type: 'email_sent',
      event_data: {
        resend_email_id: result.id,
        template: request.template,
        subject,
        sent_at: new Date().toISOString()
      }
    })

    // Update outreach record
    await supabase.from('provider_outreach').upsert({
      email: request.provider_email,
      name: request.provider_name,
      outreach_status: 'emailed',
      last_contacted_at: new Date().toISOString(),
      contact_count: 1,
      email_template_used: request.template
    }, {
      onConflict: 'email'
    })

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
        emails_sent_today: count + 1,
        daily_limit: dailyLimit
      }),
      { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Outreach email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})

function generateOutreachHTML(request: OutreachEmailRequest): string {
  // Use the new Zero-Click magic login flow
  const claimUrl = `https://bkjwctlolhoxhnoospwp.supabase.co/functions/v1/magic-login?token=${request.claim_token}`

  if (request.template === 'initial_outreach') {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #0d9488; margin-bottom: 20px;">Hi ${request.provider_name.split(' ')[0]},</h2>

        <p style="margin-bottom: 16px; line-height: 1.6;">
          We recently launched <strong>WeddingCounselors.com</strong>, a directory exclusively for engaged couples looking for premarital counselors and wedding officiants. We found your practice information online and went ahead and created a free profile for you.
        </p>

        <p style="margin-bottom: 16px; line-height: 1.6;">
          <strong>New Feature:</strong> If you also officiate weddings (or offer SYMBIS/Prepare-Enrich), engaged couples can now filter for those specific niches in our directory.
        </p>

        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #0d9488;">Option 1: Claim Your Free Profile (Zero-Click)</p>
          <p style="margin: 0 0 12px 0; line-height: 1.5;">
            Click below to instantly authenticate into your dashboard. No password required. You can add the "Wedding Officiant" badge, edit your fees, and respond to incoming inquiries.
          </p>
          <a href="${claimUrl}" style="display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
            1-Click Claim Profile
          </a>
        </div>

        <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #dc2626;">Option 2: Request Removal</p>
          <p style="margin: 0; line-height: 1.5;">
            If you don't want to be listed, simply reply "remove me" and we'll delete your profile immediately. No questions asked.
          </p>
        </div>

        <p style="margin-bottom: 16px; line-height: 1.6;">
          This secure claim link expires in 7 days.
        </p>

        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          Best regards,<br>
          The Wedding Counselors Support Team
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

        <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
          <strong>Why did I receive this?</strong><br>
          We created your profile from publicly available information about your practice. We believe you offer premarital counseling services and may benefit from being listed.
        </p>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
          <a href="https://www.weddingcounselors.com/unsubscribe" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a> from future emails.
        </p>
      </div>
    `
  }

  // Claim reminder template
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #0d9488; margin-bottom: 20px;">Reminder: Your profile on Wedding Counselors</h2>

      <p style="margin-bottom: 16px; line-height: 1.6;">
        Hi ${request.provider_name.split(' ')[0]},
      </p>

      <p style="margin-bottom: 16px; line-height: 1.6;">
        We reached out recently about your free profile on WeddingCounselors.com. Just a quick reminder that you can now instantly claim it using our 1-click magic link:
      </p>

      <a href="${claimUrl}" style="display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-bottom: 20px;">
        1-Click Claim Profile
      </a>

      <p style="color: #666; font-size: 14px; margin-top: 24px;">
        (Reply "remove me" if you want to be unlisted, and we'll take care of it immediately.)
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <p style="color: #9ca3af; font-size: 12px;">
        <a href="https://www.weddingcounselors.com/unsubscribe" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a> from future emails.
      </p>
    </div>
  `
}
