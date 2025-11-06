import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadNotificationRequest {
  leadId: string
  profileId: string
  coupleData: {
    name: string
    email: string
    phone?: string
    wedding_date?: string
    location?: string
    message: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { leadId, profileId, coupleData }: LeadNotificationRequest = await req.json()

    // Get professional profile details
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      throw new Error('Professional profile not found')
    }

    // Get professional email
    const professionalEmail = profile.email
    if (!professionalEmail) {
      console.log('No email found for professional:', profileId)
      return new Response(
        JSON.stringify({ success: false, error: 'No email address for professional' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare email content
    const subject = `New Premarital Counseling Inquiry from ${coupleData.name}`
    
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0077be 0%, #ff6b35 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Lead from Premarital Directory</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #0077be; margin-top: 0;">Couple Information</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Names:</strong> ${coupleData.name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${coupleData.email}">${coupleData.email}</a></p>
            ${coupleData.phone ? `<p style="margin: 0 0 10px 0;"><strong>Phone:</strong> <a href="tel:${coupleData.phone}">${coupleData.phone}</a></p>` : ''}
            ${coupleData.wedding_date ? `<p style="margin: 0 0 10px 0;"><strong>Wedding Date:</strong> ${new Date(coupleData.wedding_date).toLocaleDateString()}</p>` : ''}
            ${coupleData.location ? `<p style="margin: 0 0 10px 0;"><strong>Location:</strong> ${coupleData.location}</p>` : ''}
          </div>

          <h3 style="color: #0077be; margin-bottom: 10px;">Their Message:</h3>
          <div style="background: #fff; padding: 20px; border-left: 4px solid #ff6b35; margin: 20px 0; font-style: italic;">
            "${coupleData.message}"
          </div>

          <div style="margin: 30px 0; padding: 20px; background: #e8f4f8; border-radius: 6px;">
            <h3 style="color: #0077be; margin-top: 0;">Next Steps:</h3>
            <ol style="color: #333; line-height: 1.6;">
              <li>Reply directly to this couple at <a href="mailto:${coupleData.email}">${coupleData.email}</a></li>
              <li>Introduce yourself and your approach to premarital counseling</li>
              <li>Suggest scheduling an initial consultation</li>
              <li>Update the lead status in your <a href="${Deno.env.get('SITE_URL') || 'https://premarital-directory.com'}/professional/leads">professional dashboard</a></li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${coupleData.email}?subject=Re: Premarital Counseling Inquiry" style="background: #0077be; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reply to Couple</a>
          </div>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666;">
            <p>This lead was generated through the Premarital Counseling Directory. You can manage all your leads and update statuses in your <a href="${Deno.env.get('SITE_URL') || 'https://premarital-directory.com'}/professional/dashboard">professional dashboard</a>.</p>
            <p>Questions? Contact our support team at <a href="mailto:support@premarital-directory.com">support@premarital-directory.com</a></p>
          </div>
        </div>
      </div>
    `

    const textContent = `
      New Premarital Counseling Inquiry from ${coupleData.name}

      Couple Information:
      Names: ${coupleData.name}
      Email: ${coupleData.email}
      ${coupleData.phone ? `Phone: ${coupleData.phone}` : ''}
      ${coupleData.wedding_date ? `Wedding Date: ${new Date(coupleData.wedding_date).toLocaleDateString()}` : ''}
      ${coupleData.location ? `Location: ${coupleData.location}` : ''}

      Their Message:
      "${coupleData.message}"

      Next Steps:
      1. Reply directly to this couple at ${coupleData.email}
      2. Introduce yourself and your approach to premarital counseling
      3. Suggest scheduling an initial consultation
      4. Update the lead status in your professional dashboard

      Reply to couple: mailto:${coupleData.email}?subject=Re: Premarital Counseling Inquiry
      Manage leads: ${Deno.env.get('SITE_URL') || 'https://premarital-directory.com'}/professional/leads

      This lead was generated through the Premarital Counseling Directory.
      Questions? Contact support@premarital-directory.com
    `

    // Send email using SMTP2GO
    try {
      const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY')
      const fromEmail = Deno.env.get('SMTP2GO_FROM_EMAIL') || 'leads@premarital-directory.com'
      
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
          to: [professionalEmail],
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

    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Don't fail the function - log and continue
    }

    // Mark the lead as notified
    await supabaseClient
      .from('profile_leads')
      .update({ 
        professional_notified: true,
        admin_notified: true
      })
      .eq('id', leadId)

    return new Response(
      JSON.stringify({ success: true, message: 'Lead notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-lead-notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})