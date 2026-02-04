import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getAllowedOrigins, getCorsHeaders, isOriginAllowed, requireUser } from '../_shared/auth.ts'

interface ClaimRequest {
  token: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration missing' }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const userResult = await requireUser(req, supabaseUrl, supabaseAnonKey)
    if (!userResult.ok) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const { token }: ClaimRequest = await req.json()
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, city, state_province, slug, claim_token_expires_at, is_claimed')
      .eq('claim_token', token)
      .single()

    if (error || !profile) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired claim link' }),
        { status: 404, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    if (profile.claim_token_expires_at && new Date(profile.claim_token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Claim link expired' }),
        { status: 410, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    if (profile.is_claimed) {
      return new Response(
        JSON.stringify({ error: 'Profile already claimed' }),
        { status: 409, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        user_id: userResult.user.id,
        is_claimed: true,
        claimed_at: now,
        claim_token: null,
        claim_token_expires_at: null,
        moderation_status: 'approved'
      })
      .eq('id', profile.id)
      .eq('claim_token', token)

    if (updateError) {
      throw updateError
    }

    const providerEmail = profile.email || userResult.user.email

    if (providerEmail) {
      await supabase.from('provider_events').insert({
        provider_email: providerEmail,
        profile_id: profile.id,
        event_type: 'claimed',
        event_data: {
          claimed_by_user_id: userResult.user.id,
          claimed_by_email: userResult.user.email,
          claim_token_used: token,
          claimed_at: now
        }
      })
    }

    if (profile.email) {
      await supabase.from('provider_outreach').upsert({
        email: profile.email,
        name: profile.full_name,
        city: profile.city,
        state: profile.state_province,
        outreach_status: 'claimed',
        profile_id: profile.id,
        updated_at: now
      }, {
        onConflict: 'email'
      })
    }

    return new Response(
      JSON.stringify({ success: true, profileId: profile.id, slug: profile.slug }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})
