import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
Email: ${coupleEmail}${coupleLocation ? `
Location: ${locationText}` : ''}

After claiming, reply to them directly.

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
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
