import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

/**
 * One-click unsubscribe from weekly digest emails.
 * GET /unsubscribe-digest?profile_id=X&type=weekly_digest
 *
 * Returns a simple HTML page confirming unsubscription.
 * No auth required - the profile_id acts as the token.
 */

serve(async (req) => {
  const url = new URL(req.url)
  const profileId = url.searchParams.get('profile_id')
  const type = url.searchParams.get('type') || 'weekly_digest'

  if (!profileId) {
    return new Response(renderHTML('Missing profile ID', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get current preferences
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email_preferences')
      .eq('id', profileId)
      .single()

    if (error || !profile) {
      return new Response(renderHTML('Profile not found', false), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Update preference
    const prefs = profile.email_preferences || {}
    prefs[type] = false

    await supabase
      .from('profiles')
      .update({ email_preferences: prefs })
      .eq('id', profileId)

    return new Response(renderHTML(profile.full_name, true), {
      headers: { 'Content-Type': 'text/html' },
    })

  } catch (err) {
    console.error('Unsubscribe error:', err)
    return new Response(renderHTML('Something went wrong', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
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
      <p>Hi ${nameOrError}, you've been unsubscribed from weekly digest emails. You can re-enable them anytime from your <a href="https://www.weddingcounselors.com/professional/dashboard">dashboard</a>.</p>
      <p>You'll still receive inquiry notifications when couples contact you.</p>
    ` : `
      <h1>Error</h1>
      <p>${nameOrError}. Please contact <a href="mailto:hello@weddingcounselors.com">hello@weddingcounselors.com</a> for help.</p>
    `}
    <a href="https://www.weddingcounselors.com">Back to Wedding Counselors</a>
  </div>
</body>
</html>`
}
