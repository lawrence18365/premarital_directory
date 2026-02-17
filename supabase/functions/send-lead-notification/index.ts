import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getAllowedOrigins, getCorsHeaders, getRequestIp, isOriginAllowed } from "../_shared/auth.ts"
import { enforceRateLimit } from "../_shared/rateLimit.ts"

interface LeadNotificationRequest {
  leadId: string
  profileId: string | null
  isUnmatchedLead?: boolean
  matchContext?: string
  coupleData: {
    name: string
    email: string
    phone?: string
    wedding_date?: string
    timeline?: string
    location?: string
    message: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const rateLimit = await enforceRateLimit({
      supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      endpoint: 'send-lead-notification',
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

    const { leadId, profileId, coupleData, isUnmatchedLead, matchContext }: LeadNotificationRequest = await req.json()

    // Verify lead exists
    const { data: leadRecord, error: leadError } = await supabaseClient
      .from('profile_leads')
      .select('id, profile_id, professional_notified, created_at')
      .eq('id', leadId)
      .single()

    if (leadError || !leadRecord) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid lead reference' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    if (leadRecord.professional_notified) {
      return new Response(
        JSON.stringify({ success: true, message: 'Lead already notified' }),
        { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    // Common email variables
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.weddingcounselors.com'
    const inquiryTimestampIso = leadRecord.created_at || new Date().toISOString()
    const inquiryTimestampLabel = new Date(inquiryTimestampIso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })
    const inquiryReference = `INQ-${leadId.slice(0, 8).toUpperCase()}`
    const adminEmail = 'hello@weddingcounselors.com'

    let recipientEmail: string
    let subject: string
    let emailHeadline: string
    let emailFooterLinks: string

    if (isUnmatchedLead) {
      // Unmatched lead - send to admin for manual routing
      recipientEmail = adminEmail
      subject = `[ACTION NEEDED] New unmatched lead from ${coupleData.name} (${matchContext || 'General'}) - ${inquiryReference}`
      emailHeadline = `New unmatched inquiry - needs manual routing`
      emailFooterLinks = `
        <div style="margin: 30px 0; text-align: center;">
          <a href="mailto:${coupleData.email}?subject=Re: Premarital Counseling Inquiry" style="display: inline-block; background: #111827; color: white; padding: 12px 22px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 8px;">Reply to couple</a>
          <a href="${siteUrl}/admin" style="display: inline-block; background: white; color: #111827; border: 1px solid #d1d5db; padding: 12px 22px; text-decoration: none; border-radius: 6px; font-weight: 600;">Open admin</a>
        </div>
      `
    } else {
      // Matched lead - verify profile exists
      if (!profileId || leadRecord.profile_id !== profileId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid lead reference' }),
          { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
        )
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (profileError || !profile) {
        throw new Error('Professional profile not found')
      }

      recipientEmail = profile.email
      if (!recipientEmail) {
        console.log('No email found for professional:', profileId)
        return new Response(
          JSON.stringify({ success: false, error: 'No email address for professional' }),
          { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
        )
      }

      subject = `New inquiry from ${coupleData.name} - ${inquiryReference}`
      emailHeadline = `New inquiry from your listing`
      emailFooterLinks = `
        <div style="margin: 30px 0; text-align: center;">
          <a href="${siteUrl}/professional/leads" style="display: inline-block; background: #111827; color: white; padding: 12px 22px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 8px;">View inquiry</a>
          <a href="${siteUrl}/professional/dashboard" style="display: inline-block; background: white; color: #111827; border: 1px solid #d1d5db; padding: 12px 22px; text-decoration: none; border-radius: 6px; font-weight: 600;">Open dashboard</a>
        </div>
      `
    }

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1f2937; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">${emailHeadline}</h1>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 6px 0; color: #4b5563; font-size: 14px;"><strong>${inquiryReference}</strong></p>
          <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px;">Received: ${inquiryTimestampLabel}</p>
          ${isUnmatchedLead ? `<p style="margin: 0 0 20px 0; color: #b45309; font-size: 14px; font-weight: 600;">Source: ${matchContext || 'General'} page (no specific counselor selected)</p>` : ''}
          <h2 style="color: #111827; margin-top: 0;">Couple details</h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Names:</strong> ${coupleData.name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${coupleData.email}">${coupleData.email}</a></p>
            ${coupleData.phone ? `<p style="margin: 0 0 10px 0;"><strong>Phone:</strong> <a href="tel:${coupleData.phone}">${coupleData.phone}</a></p>` : ''}
            ${coupleData.wedding_date ? `<p style="margin: 0 0 10px 0;"><strong>Wedding Date:</strong> ${new Date(coupleData.wedding_date).toLocaleDateString()}</p>` : ''}
            ${coupleData.timeline ? `<p style="margin: 0 0 10px 0;"><strong>Timeline:</strong> ${coupleData.timeline}</p>` : ''}
            ${coupleData.location ? `<p style="margin: 0 0 10px 0;"><strong>Location:</strong> ${coupleData.location}</p>` : ''}
          </div>

          <h3 style="color: #111827; margin-bottom: 10px;">Message</h3>
          <div style="background: #fff; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0; font-style: italic;">
            "${coupleData.message}"
          </div>

          ${emailFooterLinks}

          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #4b5563;">
            <p>Reply directly to this email to respond to ${coupleData.name}.</p>
            <p>Questions? Contact <a href="mailto:hello@weddingcounselors.com">hello@weddingcounselors.com</a>.</p>
          </div>
        </div>
      </div>
    `

    const textContent = `
      New inquiry from ${coupleData.name}
      ${isUnmatchedLead ? `Source: ${matchContext || 'General'} page (no specific counselor selected)\n` : ''}
      ${inquiryReference}
      Received: ${inquiryTimestampLabel}

      Couple Information:
      Names: ${coupleData.name}
      Email: ${coupleData.email}
      ${coupleData.phone ? `Phone: ${coupleData.phone}` : ''}
      ${coupleData.wedding_date ? `Wedding Date: ${new Date(coupleData.wedding_date).toLocaleDateString()}` : ''}
      ${coupleData.timeline ? `Timeline: ${coupleData.timeline}` : ''}
      ${coupleData.location ? `Location: ${coupleData.location}` : ''}

      Message:
      "${coupleData.message}"

      Reply directly to this email to respond to ${coupleData.name}.
      Questions? Contact hello@weddingcounselors.com
    `

    // Send email using SMTP2GO
    try {
      const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY')
      const fromEmail = Deno.env.get('SMTP2GO_FROM_EMAIL') || 'leads@weddingcounselors.com'

      if (!smtp2goApiKey) {
        throw new Error('SMTP2GO_API_KEY not configured')
      }

      const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Smtp2go-Api-Key': smtp2goApiKey
        },
        body: JSON.stringify({
          api_key: smtp2goApiKey,
          to: [recipientEmail],
          bcc: recipientEmail !== adminEmail ? [adminEmail] : [],
          sender: fromEmail,
          subject: subject,
          html_body: htmlContent,
          text_body: textContent,
          reply_to: coupleData.email,
          custom_headers: [
            {
              header: 'X-Lead-Source',
              value: 'Premarital Directory'
            }
          ]
        })
      })

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json()
        throw new Error(`SMTP2GO API error: ${emailResponse.status} - ${JSON.stringify(errorData)}`)
      }

      const responseData = await emailResponse.json()
      console.log('Email sent successfully via SMTP2GO:', responseData)

      // Email sent successfully — mark the lead as notified
      await supabaseClient
        .from('profile_leads')
        .update({
          professional_notified: isUnmatchedLead ? false : true,
          admin_notified: true
        })
        .eq('id', leadId)

    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Explicitly mark as NOT notified so admin can catch it
      await supabaseClient
        .from('profile_leads')
        .update({
          professional_notified: false,
          admin_notified: false
        })
        .eq('id', leadId)
    }

    return new Response(
      JSON.stringify({ success: true, message: isUnmatchedLead ? 'Admin notification sent' : 'Lead notification sent' }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-lead-notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})
