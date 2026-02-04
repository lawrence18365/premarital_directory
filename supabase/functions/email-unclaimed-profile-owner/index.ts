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

    const firstName = professionalName.split(' ')[0]
    const locationText = coupleLocation || (city ? `${city}, ${state}` : 'your area')

    // Plain text email (no HTML spam design)
    const emailText = `Hi ${firstName},

A couple just tried to contact you through WeddingCounselors.com.

${coupleName}${coupleLocation ? ` from ${locationText}` : ''} filled out your contact form and their message is waiting for you.

To read their inquiry and respond, claim your free profile:
${claimUrl}

Once you claim (takes 2 min), you can:
• Read ${coupleName}'s full message
• Receive future inquiries to your inbox
• Update your profile & availability
• Track leads & views

100% free. No credit card.

---
COUPLE'S INFO:
Name: ${coupleName}
Email: [Claim Profile to View]${coupleLocation ? `
Location: ${locationText}` : ''}

After claiming, you'll see their full contact info and can reply directly.

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
        subject: `A couple tried to contact you – ${coupleName}`,
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
