import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return Response.redirect('https://weddingcounselors.com/claim-profile', 302)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Server configuration missing')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Look up the profile using the claim_token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, is_claimed, claim_token_expires_at')
      .eq('claim_token', token)
      .single()

    // 2. Validate token (invalid, already claimed, or expired)
    if (profileError || !profile) {
      console.error('Profile lookup failed:', profileError)
      return Response.redirect('https://weddingcounselors.com/claim-profile?error=invalid_token', 302)
    }

    if (profile.is_claimed) {
      return Response.redirect('https://weddingcounselors.com/login?message=already_claimed', 302)
    }

    if (profile.claim_token_expires_at && new Date(profile.claim_token_expires_at) < new Date()) {
      return Response.redirect('https://weddingcounselors.com/claim-profile?error=expired_token', 302)
    }

    if (!profile.email) {
      console.error('Profile has no email attached')
      return Response.redirect('https://weddingcounselors.com/claim-profile', 302)
    }

    // 3. Generate a True Magic Link for their email via Supabase Auth Admin
    // Since they clicked through an email, we verify them instantly with a magic link redirect.
    // The redirect goes to /claim-success with the original token, which performs the actual DB claim.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
      options: {
        redirectTo: `https://weddingcounselors.com/claim-success?token=${encodeURIComponent(token)}`
      },
    })

    if (authError || !authData?.properties?.action_link) {
      console.error('Failed to generate magic link:', authError)
      throw new Error('Unable to generate magic link')
    }

    // 4. Perform a 302 Redirect directly to the action_link.
    // When the browser follows this link, Supabase sets the secure cookies and then redirects 
    // to our specified `redirectTo` above.
    return Response.redirect(authData.properties.action_link, 302)

  } catch (error) {
    console.error('Magic link generation error:', error)
    return Response.redirect('https://weddingcounselors.com/claim-profile?error=server_error', 302)
  }
})
