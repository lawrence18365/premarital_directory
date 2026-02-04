import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getAllowedOrigins, getCorsHeaders, getRequestIp, isOriginAllowed, requireAdmin } from '../_shared/auth.ts'
import { enforceRateLimit } from '../_shared/rateLimit.ts'

interface ClaimEmailRequest {
  type: 'submitted' | 'approved' | 'rejected'
  to: string
  claimData: Record<string, any>
  profileUrl?: string
  reason?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    const origin = req.headers.get('origin')
    const { type, to, claimData, profileUrl, reason }: ClaimEmailRequest = await req.json()

    if (!type || !to || !claimData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const internalKey = Deno.env.get('INTERNAL_API_KEY')
    const providedInternalKey = req.headers.get('x-internal-api-key')
    const isInternal = internalKey && providedInternalKey === internalKey

    if (type === 'submitted') {
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
        endpoint: 'send-claim-email-submitted',
        ipAddress: getRequestIp(req),
        windowSeconds: 3600,
        maxRequests: 5
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
    } else if (!isInternal) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      const adminResult = await requireAdmin(req, supabaseUrl, supabaseAnonKey, supabaseServiceKey)
      if (!adminResult.ok) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
        )
      }
    }

    const { subject, html } = buildEmail(type, claimData, profileUrl, reason)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Wedding Counselors <noreply@weddingcounselors.com>',
        to: [to],
        subject,
        html
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${response.status} - ${error}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})

function buildEmail(type: ClaimEmailRequest['type'], claimData: Record<string, any>, profileUrl?: string, reason?: string) {
  if (type === 'submitted') {
    return {
      subject: 'Your Profile Claim Has Been Submitted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Profile Claim Submitted Successfully</h2>
          <p>Hi ${claimData.full_name || 'there'},</p>
          <p>Thank you for submitting your claim to Premarital Counseling Directory!</p>
          <p>We've received your information and will review it within 24-48 hours. You'll receive an email once your claim is approved.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Submitted Information:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Name:</strong> ${claimData.full_name || ''}</li>
              <li><strong>Email:</strong> ${claimData.email || ''}</li>
              <li><strong>Profession:</strong> ${claimData.profession || 'Not specified'}</li>
              <li><strong>Location:</strong> ${claimData.city || ''}, ${claimData.state_province || ''}</li>
            </ul>
          </div>
          <p>If you have any questions, reply to this email or contact us.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br>The Premarital Counseling Directory Team</p>
        </div>
      `
    }
  }

  if (type === 'approved') {
    return {
      subject: 'Your Profile Claim Has Been Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">Claim Approved</h2>
          </div>
          <div style="padding: 20px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
            <p>Hi ${claimData.full_name || 'there'},</p>
            <p><strong>Great news!</strong> Your profile claim has been approved.</p>
            <p>Your profile is now live on Premarital Counseling Directory:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${profileUrl || '#'}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Profile</a>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Next Steps:</h3>
              <ol style="color: #4b5563; line-height: 1.8;">
                <li>Log in to your dashboard to complete your profile</li>
                <li>Add photos, update your bio, and list your specialties</li>
                <li>Start receiving inquiries from engaged couples</li>
              </ol>
            </div>
            <p>If you need any help getting started, feel free to reply to this email.</p>
            <p style="color: #10b981; font-weight: bold; margin-top: 30px;">Welcome to the directory!</p>
          </div>
        </div>
      `
    }
  }

  return {
    subject: 'Update on Your Profile Claim',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Profile Claim Update</h2>
        <p>Hi ${claimData.full_name || 'there'},</p>
        <p>Thank you for your interest in joining Premarital Counseling Directory.</p>
        <p>Unfortunately, we were unable to approve your profile claim at this time.</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Reason:</strong> ${reason || 'Not specified'}</p>
        </div>
        <p>If you believe this is an error or have additional information, please reply to this email.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br>The Premarital Counseling Directory Team</p>
      </div>
    `
  }
}
