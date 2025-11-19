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

const FROM_EMAIL = Deno.env.get('SMTP2GO_FROM_EMAIL') || 'hello@weddingcounselors.com'

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
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

    if (!SMTP2GO_API_KEY) {
      throw new Error('SMTP2GO_API_KEY not configured')
    }

    const firstName = professionalName.split(' ')[0]
    const locationText = coupleLocation || (city ? `${city}, ${state}` : 'your area')

    // Email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim Your Profile</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 32px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                🎉 A couple just tried to contact you!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi ${firstName},
              </p>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #333333;">
                Great news! <strong>${coupleName}</strong>${coupleLocation ? ` from ${locationText}` : ''} just tried to reach you through your profile on <strong>WeddingCounselors.com</strong>.
              </p>

              <div style="background-color: #fff5f0; border-left: 4px solid #ff6b35; padding: 16px 20px; margin: 0 0 24px; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #333333;">
                  <strong>📩 Their message is waiting for you</strong><br>
                  To read their full inquiry and respond directly, you'll need to claim your free profile.
                </p>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555;">
                Your listing was created to help engaged couples${city ? ` in ${city}` : ''} find premarital counseling. Once you claim it (takes 2 minutes), you'll be able to:
              </p>

              <ul style="margin: 0 0 32px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #555555;">
                <li>✅ Read ${coupleName}'s full message</li>
                <li>✅ Receive future inquiries directly to your inbox</li>
                <li>✅ Update your bio, specialties, and availability</li>
                <li>✅ Track profile views and leads</li>
              </ul>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${claimUrl}" style="display: inline-block; background-color: #ff6b35; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 700; font-size: 16px; box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);">
                      Claim Your Free Profile →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; font-size: 14px; line-height: 1.6; color: #777777; text-align: center;">
                No credit card required • 100% free forever
              </p>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="border-top: 1px solid #eeeeee; padding-top: 24px;">
                <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666666;">
                  <strong>Couple's contact info:</strong><br>
                  📧 Email: ${coupleEmail}${coupleLocation ? `<br>📍 Location: ${locationText}` : ''}
                </p>
                <p style="margin: 16px 0 0; font-size: 13px; line-height: 1.6; color: #999999;">
                  <em>After claiming your profile, you can reply to them directly.</em>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 24px 40px; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.6; color: #777777;">
                Questions? Just reply to this email or visit our <a href="https://www.weddingcounselors.com/support" style="color: #ff6b35; text-decoration: none;">Help Center</a>.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #999999;">
                Wedding Counselors – Connecting Couples with Premarital Specialists<br>
                <a href="https://www.weddingcounselors.com/privacy" style="color: #999999; text-decoration: underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Plain text version
    const emailText = `
Hi ${firstName},

Great news! ${coupleName}${coupleLocation ? ` from ${locationText}` : ''} just tried to reach you through your profile on WeddingCounselors.com.

THEIR MESSAGE IS WAITING FOR YOU

To read their full inquiry and respond directly, claim your free profile:
${claimUrl}

Your listing was created to help engaged couples${city ? ` in ${city}` : ''} find premarital counseling. Once you claim it (takes 2 minutes), you'll be able to:

✅ Read ${coupleName}'s full message  
✅ Receive future inquiries directly to your inbox
✅ Update your bio, specialties, and availability
✅ Track profile views and leads

NO CREDIT CARD REQUIRED • 100% FREE FOREVER

---
Couple's Contact Info:
Email: ${coupleEmail}${coupleLocation ? `\nLocation: ${locationText}` : ''}

After claiming your profile, you can reply to them directly.

---
Questions? Visit https://www.weddingcounselors.com/support

Wedding Counselors – Connecting Couples with Premarital Specialists
    `

    // Send email via SMTP2GO
    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': SMTP2GO_API_KEY
      },
      body: JSON.stringify({
        api_key: SMTP2GO_API_KEY,
        to: [profileEmail],
        sender: FROM_EMAIL,
        subject: 'A couple just tried to contact you – WeddingCounselors.com',
        html_body: emailHtml,
        text_body: emailText,
        custom_headers: [
          {
            header: 'Reply-To',
            value: 'hello@weddingcounselors.com'
          }
        ]
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      throw new Error(`SMTP2GO API error: ${JSON.stringify(errorData)}`)
    }

    const emailData = await emailResponse.json()
    console.log('Email sent successfully via SMTP2GO:', emailData)

    return new Response(
      JSON.stringify({ success: true, emailData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending claim notification email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
