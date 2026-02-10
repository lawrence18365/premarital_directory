import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getAllowedOrigins, getCorsHeaders, getRequestIp, isOriginAllowed } from '../_shared/auth.ts'
import { enforceRateLimit } from '../_shared/rateLimit.ts'

interface ClaimProgramRequest {
  token: string
  claimantEmail: string
}

const getDomain = (value: string) => {
  const normalized = (value || '').trim().toLowerCase()
  const parts = normalized.split('@')
  return parts.length === 2 ? parts[1] : null
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
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration missing' }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const rateLimit = await enforceRateLimit({
      supabaseUrl,
      serviceKey: supabaseServiceKey,
      endpoint: 'claim-program',
      ipAddress: getRequestIp(req),
      windowSeconds: 3600,
      maxRequests: 15
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

    const { token, claimantEmail }: ClaimProgramRequest = await req.json()
    if (!token || !claimantEmail) {
      return new Response(
        JSON.stringify({ error: 'token and claimantEmail are required' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const claimantDomain = getDomain(claimantEmail)
    if (!claimantDomain) {
      return new Response(
        JSON.stringify({ error: 'A valid claimantEmail is required' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: claim, error: claimError } = await supabase
      .from('program_claims')
      .select(`
        id,
        status,
        token_expires_at,
        office_email,
        program_id,
        program:programs (
          id,
          name,
          verification_status,
          church:churches (
            id,
            name
          )
        )
      `)
      .eq('claim_token', token)
      .single()

    if (claimError || !claim) {
      return new Response(
        JSON.stringify({ error: 'Invalid claim link' }),
        { status: 404, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    if (new Date(claim.token_expires_at) < new Date()) {
      await supabase
        .from('program_claims')
        .update({ status: 'expired', notes: 'Token expired before claim completion' })
        .eq('id', claim.id)

      return new Response(
        JSON.stringify({ error: 'Claim link expired' }),
        { status: 410, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    if (claim.status === 'verified') {
      return new Response(
        JSON.stringify({ success: true, alreadyVerified: true }),
        { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const officeDomain = getDomain(claim.office_email)
    if (!officeDomain) {
      return new Response(
        JSON.stringify({ error: 'Program has no valid office email domain for verification' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date().toISOString()
    const domainMatches = officeDomain === claimantDomain

    if (!domainMatches) {
      await supabase
        .from('program_claims')
        .update({
          submitted_by_email: claimantEmail,
          submitted_by_domain: claimantDomain,
          status: 'pending_manual_review',
          notes: `Domain mismatch: expected ${officeDomain}, received ${claimantDomain}`
        })
        .eq('id', claim.id)

      await supabase
        .from('programs')
        .update({
          verification_status: 'pending_manual_review',
          is_published: false
        })
        .eq('id', claim.program_id)

      return new Response(
        JSON.stringify({
          success: false,
          manualReviewRequired: true,
          message: 'Domain does not match office email. Your request was queued for manual review.'
        }),
        { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    await supabase
      .from('program_claims')
      .update({
        submitted_by_email: claimantEmail,
        submitted_by_domain: claimantDomain,
        status: 'verified',
        verified_at: now
      })
      .eq('id', claim.id)

    await supabase
      .from('programs')
      .update({
        verification_status: 'verified',
        is_published: true,
        verified_at: now,
        verification_notes: `Auto-verified by domain match (${claimantDomain})`
      })
      .eq('id', claim.program_id)

    const program = Array.isArray(claim.program) ? claim.program[0] : claim.program
    const church = Array.isArray(program?.church) ? program?.church[0] : program?.church

    return new Response(
      JSON.stringify({
        success: true,
        published: true,
        program: {
          id: program?.id,
          name: program?.name,
          churchName: church?.name
        }
      }),
      { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('claim-program error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
