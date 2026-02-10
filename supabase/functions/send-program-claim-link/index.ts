import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getAllowedOrigins, getCorsHeaders, getRequestIp, isOriginAllowed, requireAdmin } from '../_shared/auth.ts'
import { enforceRateLimit } from '../_shared/rateLimit.ts'

interface SendProgramClaimLinkRequest {
  programId: string
  resendToEmail?: string
}

const getInternalAuth = (req: Request) => {
  const internalKey = Deno.env.get('INTERNAL_API_KEY')
  const providedInternalKey = req.headers.get('x-internal-api-key')
  return Boolean(internalKey && providedInternalKey && internalKey === providedInternalKey)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  const origin = req.headers.get('origin')

  try {
    const allowedOrigins = getAllowedOrigins()
    if (!isOriginAllowed(origin, allowedOrigins)) {
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        { status: 403, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration missing' }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const isInternal = getInternalAuth(req)
    if (!isInternal) {
      const adminResult = await requireAdmin(req, supabaseUrl, supabaseAnonKey, supabaseServiceKey)
      if (!adminResult.ok) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
        )
      }
    }

    const rateLimit = await enforceRateLimit({
      supabaseUrl,
      serviceKey: supabaseServiceKey,
      endpoint: 'send-program-claim-link',
      ipAddress: getRequestIp(req),
      windowSeconds: 3600,
      maxRequests: 20
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

    const { programId, resendToEmail }: SendProgramClaimLinkRequest = await req.json()
    if (!programId) {
      return new Response(
        JSON.stringify({ error: 'programId is required' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        verification_status,
        is_published,
        church:churches (
          id,
          name,
          city,
          state_province,
          office_email
        )
      `)
      .eq('id', programId)
      .single()

    if (programError || !program) {
      return new Response(
        JSON.stringify({ error: 'Program not found' }),
        { status: 404, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const church = Array.isArray(program.church) ? program.church[0] : program.church
    const officeEmail = (resendToEmail || church?.office_email || '').trim().toLowerCase()
    if (!officeEmail || !officeEmail.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Program has no valid office email' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const claimToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

    await supabase
      .from('program_claims')
      .update({ status: 'expired', notes: 'Superseded by newer token' })
      .eq('program_id', programId)
      .eq('status', 'pending')

    const { error: claimInsertError } = await supabase
      .from('program_claims')
      .insert({
        program_id: programId,
        office_email: officeEmail,
        claim_token: claimToken,
        token_expires_at: expiresAt,
        status: 'pending'
      })

    if (claimInsertError) {
      throw claimInsertError
    }

    await supabase
      .from('programs')
      .update({
        verification_status: 'pending',
        is_published: false
      })
      .eq('id', programId)

    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.weddingcounselors.com'
    const claimUrl = `${siteUrl}/claim-program/${claimToken}`
    const subject = `Verify your Pre-Cana program listing: ${program.name}`
    const textBody = `Hi ${church?.name || 'there'},

We received a request to verify your program listing on WeddingCounselors.com.

Program: ${program.name}
Location: ${church?.city || ''}, ${church?.state_province || ''}

Verify this listing by opening the secure link below:
${claimUrl}

This link expires in 7 days.

If you did not request this, you can ignore this email.

Wedding Counselors
hello@weddingcounselors.com`

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Wedding Counselors <noreply@weddingcounselors.com>',
        to: [officeEmail],
        reply_to: 'hello@weddingcounselors.com',
        subject,
        text: textBody
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      throw new Error(`Resend API error: ${emailResponse.status} - ${errorText}`)
    }

    return new Response(
      JSON.stringify({ success: true, claimUrl, expiresAt }),
      { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-program-claim-link error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
