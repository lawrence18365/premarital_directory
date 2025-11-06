import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  profileId: string
  email: string
  name: string
  profession: string
  city: string
  state: string
  viewCount?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profileId, email, name, profession, city, state, viewCount = 47 }: EmailRequest = await req.json()

    // Validate required fields
    if (!profileId || !email || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: profileId, email, name' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get SMTP2GO configuration from environment
    const apiKey = Deno.env.get('SMTP2GO_API_KEY')
    const fromEmail = Deno.env.get('SMTP2GO_FROM_EMAIL') || 'info@weddingcounselors.com'

    if (!apiKey) {
      console.error('SMTP2GO_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate claim URL
    const claimUrl = `https://weddingcounselors.com/claim-profile/${profileId}`
    const searchUrl = `https://weddingcounselors.com/professionals?search=${encodeURIComponent(name)}`

    // Create email content
    const subject = `Your WeddingCounselors.com profile has ${viewCount} views this month!`
    
    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Claim Your Profile - WeddingCounselors.com</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px 20px; border: 1px solid #e5e7eb; }
            .profile-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .stats { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; }
            .cta-button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
            .benefits { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .urgent { color: #dc2626; font-weight: 600; }
            .green { color: #059669; }
            .blue { color: #0ea5e9; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Great News, ${name}!</h1>
                <p>Your profile is getting attention from couples planning their marriage</p>
            </div>
            
            <div class="content">
                <div class="stats">
                    <h3 class="blue">📊 Your Profile Performance This Month</h3>
                    <ul>
                        <li><strong>${viewCount} profile views</strong> from engaged couples</li>
                        <li><strong>Listed in ${city}, ${state}</strong> - prime location!</li>
                        <li><strong>Showing as "Unclaimed"</strong> - <span class="urgent">reducing inquiries by 73%</span></li>
                    </ul>
                </div>

                <div class="profile-box">
                    <h3>Is this your profile?</h3>
                    <p><strong>${name}</strong><br>
                    ${profession}<br>
                    ${city}, ${state}</p>
                    <p class="urgent">⚠️ Currently showing as "Unverified Professional"</p>
                </div>

                <h3>Claim your profile in 60 seconds to:</h3>
                <div class="benefits">
                    <ul>
                        <li class="green">✅ Add your photo & complete bio</li>
                        <li class="green">✅ Show "Verified Professional" badge</li>
                        <li class="green">✅ Receive direct client inquiries</li>
                        <li class="green">✅ Control your listing details</li>
                        <li class="green">✅ Start appearing in search results immediately</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${claimUrl}" class="cta-button">🚀 Claim Your Profile NOW (Free!)</a>
                </div>

                <p><strong>Why This Matters:</strong> Couples search for premarital counselors every day on WeddingCounselors.com. Verified profiles get 3x more inquiries than unverified ones.</p>

                <p>Don't let potential clients pass you by. Your colleagues are already claiming their profiles and getting more leads.</p>

                <div style="text-align: center; margin: 20px 0;">
                    <a href="${searchUrl}" style="color: #0ea5e9; text-decoration: none;">👀 View Your Current Profile</a>
                </div>

                <p><em>This will only take 60 seconds, and it's completely free with no hidden fees or subscription requirements.</em></p>
            </div>

            <div class="footer">
                <p><strong>WeddingCounselors.com</strong> - The #1 Directory for Premarital Counseling Professionals</p>
                <p>This email was sent because your professional profile is listed in our directory.<br>
                <a href="mailto:info@weddingcounselors.com">Contact us</a> if you have questions.</p>
            </div>
        </div>
    </body>
    </html>
    `

    const textBody = `
Your WeddingCounselors.com profile has ${viewCount} views this month!

Hi ${name},

Great news! Your professional profile on WeddingCounselors.com has been viewed ${viewCount} times this month by couples seeking premarital counseling.

However, your profile is currently showing as "unverified" which reduces inquiries by 73%.

Is this your profile?
${name}
${profession}
${city}, ${state}

Claim your profile in 60 seconds to:
✅ Add your photo & complete bio
✅ Show "Verified Professional" badge  
✅ Receive direct client inquiries
✅ Control your listing details
✅ Start appearing in search results immediately

Claim your profile now (FREE): ${claimUrl}

Why this matters: Couples search for premarital counselors every day on WeddingCounselors.com. Verified profiles get 3x more inquiries than unverified ones.

This takes 60 seconds and is completely free with no hidden fees.

View your current profile: ${searchUrl}

Best regards,
The WeddingCounselors.com Team

--
WeddingCounselors.com - The #1 Directory for Premarital Counseling Professionals
Contact us: info@weddingcounselors.com
    `

    // Prepare SMTP2GO payload
    const emailPayload = {
      api_key: apiKey,
      to: [email],
      sender: fromEmail,
      subject: subject,
      html_body: htmlBody,
      text_body: textBody,
      custom_headers: {
        'X-Campaign-Type': 'Profile-Activation',
        'X-Profile-ID': profileId,
        'X-Lead-Source': 'Premarital Directory'
      }
    }

    // Send email via SMTP2GO
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': apiKey
      },
      body: JSON.stringify(emailPayload)
    })

    const emailResult = await response.json()

    if (!response.ok || emailResult.request_id === undefined) {
      console.error('SMTP2GO API error:', emailResult)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
          details: emailResult 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Profile activation email sent successfully:', {
      profileId,
      email,
      requestId: emailResult.request_id
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Profile activation email sent successfully',
        requestId: emailResult.request_id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error sending profile activation email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})