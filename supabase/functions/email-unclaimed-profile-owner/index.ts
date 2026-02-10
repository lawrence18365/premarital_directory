import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAllowedOrigins, getCorsHeaders, getRequestIp, isOriginAllowed } from "../_shared/auth.ts"
import { enforceRateLimit } from "../_shared/rateLimit.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    const origin = req.headers.get('origin')
    const allowedOrigins = getAllowedOrigins()
    if (!isOriginAllowed(origin, allowedOrigins)) {
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        { status: 403, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const rateLimit = await enforceRateLimit({
      supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      endpoint: 'email-unclaimed-profile-owner',
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
        : new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
          })
    }

    const {
      profileEmail,
      professionalName,
      coupleName,
      coupleEmail,
      coupleLocation,
      city,
      state,
      claimUrl,
      profileSlug
    } = await req.json()

    // Validation
    if (!profileEmail || !professionalName || !coupleName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const greetingName = professionalName?.trim() || 'there'
    const locationText = coupleLocation || (city ? `${city}, ${state}` : 'your area')

    // Plain text email (no HTML spam design)
    const emailText = `Hi ${greetingName},

New inquiry received via your listing on WeddingCounselors.com.

${coupleName}${coupleLocation ? ` from ${locationText}` : ''} submitted an inquiry. Claim your profile to view the message and reply:
${claimUrl}

After claiming, you can:
• View the full inquiry details
• Reply directly to the couple
• Receive future inquiries in your dashboard

No credit card required.

---
INQUIRY SUMMARY:
Name: ${coupleName}
Email: [Available after claim]${coupleLocation ? `
Location: ${locationText}` : ''}

You received this email because your public listing uses this contact email.
Questions? Reply to this email.

Wedding Counselors
https://www.weddingcounselors.com`

    // Send via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wedding Counselors <hello@weddingcounselors.com>',
        to: [profileEmail],
        reply_to: 'hello@weddingcounselors.com',
        subject: `New inquiry received via your listing - ${coupleName}`,
        text: emailText,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`)
    }

    const emailData = await emailResponse.json()
    console.log('Email sent successfully via Resend:', emailData)

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})
