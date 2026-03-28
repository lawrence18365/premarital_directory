import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

/**
 * One-click unsubscribe from emails.
 *
 * Supports two modes:
 * 1. Profile-based: GET ?profile_id=X&type=weekly_digest  (returns HTML page)
 * 2. Email-based:   GET ?email=X  (returns HTML page, adds to do_not_contact)
 *
 * No auth required - the profile_id or email acts as the token.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const profileId = url.searchParams.get('profile_id')
  const email = url.searchParams.get('email')?.trim().toLowerCase()
  const type = url.searchParams.get('type') || 'weekly_digest'

  if (!profileId && !email) {
    return new Response(renderHTML('Missing profile ID or email', false), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Mode 1: Profile-based unsubscribe (from digest/drip emails)
    if (profileId) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, email_preferences')
        .eq('id', profileId)
        .single()

      if (error || !profile) {
        return new Response(renderHTML('Profile not found', false), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        })
      }

      // Update preference
      const prefs = profile.email_preferences || {}
      prefs[type] = false

      await supabase
        .from('profiles')
        .update({ email_preferences: prefs })
        .eq('id', profileId)

      // Also add to do_not_contact if unsubscribing from marketing
      if (type === 'marketing' && profile.email) {
        await supabase.from('do_not_contact').upsert(
          { email: profile.email.toLowerCase(), reason: 'unsubscribe', notes: `Unsubscribed from ${type} via email link` },
          { onConflict: 'email' }
        )
      }

      return new Response(renderHTML(profile.full_name, true), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      })
    }

    // Mode 2: Email-based unsubscribe (from outreach/couple emails)
    if (email) {
      // Add to do_not_contact
      await supabase.from('do_not_contact').upsert(
        { email, reason: 'unsubscribe', notes: 'Self-service unsubscribe page' },
        { onConflict: 'email' }
      )

      // Also update profile email_preferences if they have a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email_preferences')
        .eq('email', email)
        .single()

      if (profile) {
        const prefs = profile.email_preferences || {}
        prefs.weekly_digest = false
        prefs.marketing = false
        await supabase
          .from('profiles')
          .update({ email_preferences: prefs, marketing_opt_in: false })
          .eq('id', profile.id)
      }

      // Also mark couple subscriber as unsubscribed
      await supabase
        .from('couple_subscribers')
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq('email', email)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (err) {
    console.error('Unsubscribe error:', err)
    return new Response(renderHTML('Something went wrong', false), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    })
  }
})

function renderHTML(nameOrError: string, success: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${success ? 'Unsubscribed' : 'Error'} - Wedding Counselors</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 400px; text-align: center; }
    h1 { color: ${success ? '#0d9488' : '#dc2626'}; margin: 0 0 1rem; font-size: 1.25rem; }
    p { color: #6b7280; margin: 0 0 1.5rem; font-size: 0.95rem; line-height: 1.5; }
    a { color: #0d9488; text-decoration: none; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    ${success ? `
      <h1>Unsubscribed</h1>
      <p>Hi ${nameOrError}, you've been unsubscribed. You will not receive any further emails from us.</p>
      <p>If you change your mind, you can re-enable emails from your <a href="https://www.weddingcounselors.com/professional/dashboard">dashboard</a>.</p>
    ` : `
      <h1>Error</h1>
      <p>${nameOrError}. Please contact <a href="mailto:hello@weddingcounselors.com">hello@weddingcounselors.com</a> for help.</p>
    `}
    <a href="https://www.weddingcounselors.com">Back to Wedding Counselors</a>
  </div>
</body>
</html>`
}
