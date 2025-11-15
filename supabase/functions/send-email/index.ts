import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string | string[]
  subject: string
  template: 'profile_created' | 'inquiry_to_provider' | 'inquiry_confirmation' | 'profile_nudge' | 'monthly_stats'
  data: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, template, data }: EmailRequest = await req.json()

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Generate HTML based on template
    const html = generateEmailHTML(template, data)

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wedding Counselors <noreply@weddingcounselors.com>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${response.status} - ${error}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email send error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailHTML(template: string, data: Record<string, any>): string {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
  `

  const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    background-color: #0d9488;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
  `

  switch (template) {
    case 'profile_created':
      return `
        <div style="${baseStyles}">
          <h1 style="color: #0d9488;">Welcome to Wedding Counselors!</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Your profile has been created successfully. Here's what to do next:</p>
          <ol>
            <li><strong>Complete your profile</strong> - Add your photo, bio, specialties, and pricing</li>
            <li><strong>Add your credentials</strong> - List your licenses and certifications</li>
            <li><strong>Set your availability</strong> - Let couples know your schedule</li>
          </ol>
          <p>
            <a href="${data.profileUrl}" style="${buttonStyle}">View Your Profile</a>
          </p>
          <p>Once your profile is approved, engaged couples in your area will be able to find you.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666;">
            Questions? Reply to this email or visit our <a href="https://www.weddingcounselors.com/support">support page</a>.
          </p>
        </div>
      `

    case 'inquiry_to_provider':
      return `
        <div style="${baseStyles}">
          <h1 style="color: #0d9488;">New Inquiry from a Couple</h1>
          <p>Hi ${data.providerName || 'there'},</p>
          <p>A couple in <strong>${data.city}, ${data.state}</strong> is interested in premarital counseling and has reached out to you through Wedding Counselors.</p>

          <div style="background: #f7f7f7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${data.coupleName || 'Anonymous'}</p>
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

    case 'inquiry_confirmation':
      return `
        <div style="${baseStyles}">
          <h1 style="color: #0d9488;">Your Inquiry Has Been Sent</h1>
          <p>Hi ${data.coupleName || 'there'},</p>
          <p>We've sent your message to <strong>${data.providerCount} premarital counselors</strong> in ${data.city}, ${data.state}.</p>

          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #0d9488;">
            <p style="margin: 0;"><strong>What happens next?</strong></p>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              <li>Counselors typically respond within 24-48 hours</li>
              <li>Check your inbox (and spam folder) for replies</li>
              <li>Feel free to ask questions about their approach, fees, and availability</li>
            </ul>
          </div>

          <p>
            <a href="https://www.weddingcounselors.com/premarital-counseling/${data.stateSlug}/${data.citySlug}" style="${buttonStyle}">
              Browse More Counselors in ${data.city}
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666;">
            Preparing for marriage? Check out our <a href="https://www.weddingcounselors.com/blog">relationship guidance blog</a>.
          </p>
        </div>
      `

    case 'profile_nudge':
      return `
        <div style="${baseStyles}">
          <h1 style="color: #0d9488;">Complete Your Profile</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Your profile on Wedding Counselors is only <strong>${data.completenessScore}% complete</strong>.</p>

          <p>Profiles with more details get significantly more inquiries from couples. Here's what's missing:</p>
          <ul>
            ${data.missingFields.map((field: string) => `<li>${field}</li>`).join('')}
          </ul>

          <p>
            <a href="${data.editUrl}" style="${buttonStyle}">Complete Your Profile</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666;">
            Questions? Reply to this email or visit our <a href="https://www.weddingcounselors.com/support">support page</a>.
          </p>
        </div>
      `

    case 'monthly_stats':
      return `
        <div style="${baseStyles}">
          <h1 style="color: #0d9488;">Your Monthly Stats</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Here's how your Wedding Counselors profile performed in the last 30 days:</p>

          <div style="background: #f7f7f7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Profile Views:</strong> ${data.profileViews || 0}</p>
            <p style="margin: 0 0 8px 0;"><strong>Profile Clicks:</strong> ${data.profileClicks || 0}</p>
            <p style="margin: 0 0 8px 0;"><strong>Contact Reveals:</strong> ${data.contactReveals || 0}</p>
            <p style="margin: 0;"><strong>Inquiries Received:</strong> ${data.inquiries || 0}</p>
          </div>

          ${data.inquiries > 0 ? `
            <p style="color: #0d9488; font-weight: 600;">
              Great work! You received ${data.inquiries} inquiry(ies) from couples this month.
            </p>
          ` : `
            <p>
              Want more inquiries? Make sure your profile is complete and highlights your unique approach.
            </p>
          `}

          <p>
            <a href="${data.dashboardUrl}" style="${buttonStyle}">View Full Analytics</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666;">
            Thanks for being part of Wedding Counselors!
          </p>
        </div>
      `

    default:
      return `<div style="${baseStyles}"><p>${JSON.stringify(data)}</p></div>`
  }
}
