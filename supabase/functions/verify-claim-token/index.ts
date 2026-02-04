import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getAllowedOrigins, getCorsHeaders, isOriginAllowed } from '../_shared/auth.ts'

interface VerifyRequest {
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

    const { token }: VerifyRequest = await req.json()
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, bio, profession, city, state_province, slug, is_claimed, claim_token_expires_at')
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

    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
          profession: profile.profession,
          city: profile.city,
          state_province: profile.state_province,
          slug: profile.slug
        }
      }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})
