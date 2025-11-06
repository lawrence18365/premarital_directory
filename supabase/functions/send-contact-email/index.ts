import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactEmailRequest {
  name: string
  email: string
  subject: string
  message: string
  type: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, subject, message, type }: ContactEmailRequest = await req.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY')
    const fromEmail = Deno.env.get('SMTP2GO_FROM_EMAIL') || 'noreply@premarital-directory.com'
    const supportEmail = Deno.env.get('SUPPORT_EMAIL') || 'support@premarital-directory.com'
    
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured')
    }

    // Prepare email content
    const emailSubject = `[${type.toUpperCase()}] ${subject}`
    
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0077be 0%, #ff6b35 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #0077be; margin-top: 0;">Contact Details</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 0 0 10px 0;"><strong>Type:</strong> ${type}</p>
            <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>

          <h3 style="color: #0077be; margin-bottom: 10px;">Message:</h3>
          <div style="background: #fff; padding: 20px; border-left: 4px solid #ff6b35; margin: 20px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>

          <div style="margin: 30px 0; padding: 20px; background: #e8f4f8; border-radius: 6px;">
            <p style="margin: 0; text-align: center;">
              <a href="mailto:${email}?subject=Re: ${subject}" style="background: #0077be; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reply to ${name}</a>
            </p>
          </div>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
            <p>This message was submitted through the Premarital Counseling Directory contact form.</p>
          </div>
        </div>
      </div>
    `

    const textContent = `
      New Contact Form Submission

      Contact Details:
      Name: ${name}
      Email: ${email}
      Type: ${type}
      Subject: ${subject}

      Message:
      ${message}

      Reply to ${name}: mailto:${email}?subject=Re: ${subject}

      This message was submitted through the Premarital Counseling Directory contact form.
    `

    // Send email using SMTP2GO
    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey
      },
      body: JSON.stringify({
        api_key: smtp2goApiKey,
        to: [supportEmail],
        sender: fromEmail,
        subject: emailSubject,
        html_body: htmlContent,
        text_body: textContent,
        reply_to: email,
        custom_headers: [
          {
            header: 'X-Contact-Type',
            value: type
          },
          {
            header: 'X-Form-Source',
            value: 'Premarital Directory Contact Form'
          }
        ]
      })
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      throw new Error(`SMTP2GO API error: ${emailResponse.status} - ${JSON.stringify(errorData)}`)
    }

    const responseData = await emailResponse.json()
    console.log('Contact email sent successfully via SMTP2GO:', responseData)

    return new Response(
      JSON.stringify({ success: true, message: 'Contact form submitted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-contact-email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})