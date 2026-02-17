import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getAllowedOrigins, getCorsHeaders, getRequestIp, isOriginAllowed } from "../_shared/auth.ts"
import { enforceRateLimit } from "../_shared/rateLimit.ts"

interface InquiryNotificationRequest {
  inquiryId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    const origin = req.headers.get('origin')
    const allowedOrigins = getAllowedOrigins()
    if (!isOriginAllowed(origin, allowedOrigins)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Origin not allowed' }),
        { status: 403, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const rateLimit = await enforceRateLimit({
      supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      endpoint: 'send-inquiry-notifications',
      ipAddress: getRequestIp(req),
      windowSeconds: 3600,
      maxRequests: 10
    })
    if (!rateLimit.ok) {
      return rateLimit.response
        ? new Response(await rateLimit.response.text(), {
            status: rateLimit.response.status,
            headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
          })
        : new Response(JSON.stringify({ success: false, error: 'Too many requests' }), {
            status: 429,
            headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
          })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { inquiryId }: InquiryNotificationRequest = await req.json()

    if (!inquiryId) {
      return new Response(
        JSON.stringify({ success: false, error: 'inquiryId is required' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    // Look up the inquiry record
    const { data: inquiry, error: inquiryError } = await supabaseClient
      .from('city_inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single()

    if (inquiryError || !inquiry) {
      return new Response(
        JSON.stringify({ success: false, error: 'Inquiry not found' }),
        { status: 404, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const providerIds: string[] = inquiry.provider_ids || []
    if (!providerIds.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'No providers in inquiry' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    // Look up provider emails using service role
    const { data: providers, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name')
      .in('id', providerIds)

    if (profilesError) {
      throw new Error(`Failed to look up providers: ${profilesError.message}`)
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const adminEmail = 'hello@weddingcounselors.com'
    const fromEmail = 'Wedding Counselors <noreply@weddingcounselors.com>'
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.weddingcounselors.com'

    const successfulProviders: string[] = []
    const failedProviders: string[] = []

    // Send email to each provider (try/catch per provider)
    for (const provider of (providers || [])) {
      if (!provider.email) {
        failedProviders.push(provider.id)
        continue
      }

      try {
        const providerName = provider.full_name?.split(' ')[0] || 'there'
        const html = generateProviderEmailHTML({
          providerName,
          city: inquiry.city,
          state: inquiry.state,
          coupleName: inquiry.couple_name || 'A couple',
          coupleEmail: inquiry.couple_email,
          message: inquiry.couple_message,
          dashboardUrl: `${siteUrl}/professional/analytics`,
        })

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [provider.email],
            subject: `New inquiry from a couple in ${inquiry.city}`,
            html,
            reply_to: inquiry.couple_email,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Failed to email provider ${provider.id}:`, errorText)
          failedProviders.push(provider.id)
        } else {
          successfulProviders.push(provider.id)
        }
      } catch (emailError) {
        console.error(`Error emailing provider ${provider.id}:`, emailError)
        failedProviders.push(provider.id)
      }
    }

    // Send confirmation email to the couple
    try {
      const confirmHtml = generateCoupleConfirmationHTML({
        coupleName: inquiry.couple_name || 'there',
        providerCount: successfulProviders.length,
        city: inquiry.city,
        state: inquiry.state,
        siteUrl,
      })

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [inquiry.couple_email],
          subject: `Your message was sent to ${successfulProviders.length} counselors`,
          html: confirmHtml,
        }),
      })
    } catch (confirmError) {
      console.error('Failed to send couple confirmation:', confirmError)
    }

    // Send admin notification
    try {
      const adminHtml = generateAdminNotificationHTML({
        inquiryId,
        coupleName: inquiry.couple_name || 'Anonymous',
        coupleEmail: inquiry.couple_email,
        city: inquiry.city,
        state: inquiry.state,
        message: inquiry.couple_message,
        totalProviders: providerIds.length,
        successCount: successfulProviders.length,
        failedCount: failedProviders.length,
        siteUrl,
      })

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [adminEmail],
          subject: `[City Inquiry] ${inquiry.couple_name || 'Anonymous'} in ${inquiry.city} - ${successfulProviders.length}/${providerIds.length} notified`,
          html: adminHtml,
        }),
      })
    } catch (adminError) {
      console.error('Failed to send admin notification:', adminError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        notified: successfulProviders,
        failed: failedProviders,
      }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-inquiry-notifications:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})

// --- Email template helpers ---

const baseStyles = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;`
const buttonStyle = `display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;`

function generateProviderEmailHTML(data: {
  providerName: string
  city: string
  state: string
  coupleName: string
  coupleEmail: string
  message: string
  dashboardUrl: string
}): string {
  return `
    <div style="${baseStyles}">
      <h1 style="color: #0d9488;">New Inquiry from a Couple</h1>
      <p>Hi ${data.providerName},</p>
      <p>A couple in <strong>${data.city}, ${data.state}</strong> is interested in premarital counseling and has reached out to you through Wedding Counselors.</p>
      <div style="background: #f7f7f7; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${data.coupleName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${data.coupleEmail}</p>
        <p style="margin: 0;"><strong>Message:</strong></p>
        <p style="margin: 8px 0 0 0; font-style: italic;">${data.message}</p>
      </div>
      <p><strong>Reply directly to this email to respond to the couple.</strong></p>
      <p style="margin-top: 20px;">
        <a href="${data.dashboardUrl}" style="${buttonStyle}">View Your Dashboard</a>
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 14px; color: #666;">
        This inquiry was sent via <a href="https://www.weddingcounselors.com">WeddingCounselors.com</a>
      </p>
    </div>
  `
}

function generateCoupleConfirmationHTML(data: {
  coupleName: string
  providerCount: number
  city: string
  state: string
  siteUrl: string
}): string {
  return `
    <div style="${baseStyles}">
      <h1 style="color: #0d9488;">Your Inquiry Has Been Sent</h1>
      <p>Hi ${data.coupleName},</p>
      <p>We've sent your message to <strong>${data.providerCount} premarital counselor${data.providerCount === 1 ? '' : 's'}</strong> in ${data.city}, ${data.state}.</p>
      <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #0d9488;">
        <p style="margin: 0;"><strong>What happens next?</strong></p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          <li>Counselors typically respond within 24-48 hours</li>
          <li>Check your inbox (and spam folder) for replies</li>
          <li>Feel free to ask questions about their approach, fees, and availability</li>
        </ul>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 14px; color: #666;">
        Preparing for marriage? Check out our <a href="${data.siteUrl}/blog">relationship guidance blog</a>.
      </p>
    </div>
  `
}

function generateAdminNotificationHTML(data: {
  inquiryId: string
  coupleName: string
  coupleEmail: string
  city: string
  state: string
  message: string
  totalProviders: number
  successCount: number
  failedCount: number
  siteUrl: string
}): string {
  const hasFailures = data.failedCount > 0
  return `
    <div style="${baseStyles}">
      <h1 style="color: #0d9488;">City Inquiry Notification</h1>
      <p>A couple submitted a multi-provider inquiry from the city page.</p>
      ${hasFailures ? `<p style="color: #dc2626; font-weight: 600;">Warning: ${data.failedCount} of ${data.totalProviders} provider notifications failed.</p>` : ''}
      <div style="background: #f7f7f7; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Inquiry ID:</strong> ${data.inquiryId.slice(0, 8)}</p>
        <p style="margin: 0 0 8px 0;"><strong>Couple:</strong> ${data.coupleName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${data.coupleEmail}</p>
        <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${data.city}, ${data.state}</p>
        <p style="margin: 0 0 8px 0;"><strong>Providers notified:</strong> ${data.successCount}/${data.totalProviders}</p>
        <p style="margin: 0;"><strong>Message:</strong></p>
        <p style="margin: 8px 0 0 0; font-style: italic;">${data.message}</p>
      </div>
      <p>
        <a href="${data.siteUrl}/admin/leads" style="${buttonStyle}">View All Leads</a>
      </p>
    </div>
  `
}
