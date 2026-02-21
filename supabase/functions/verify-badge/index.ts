import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the auth user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { sourceUrl } = await req.json()

    if (!sourceUrl) {
      throw new Error('sourceUrl is required')
    }

    // Ensure the profile belongs to the user
    // We could pass profileId from client but it's safer to look it up from auth.uid()
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, city, state_province')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileData) {
      throw new Error('Provider profile not found')
    }

    const profileId = profileData.id

    // We need service role to update the user's profile and insert to badge_submissions bypassing RLS if needed
    // Actually the user should be able to update their own profile with RLS. Let's use service key to be safe with badge status
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let isVerified = false
    let errorMessage = ''

    try {
      // Fetch the source URL
      const response = await fetch(sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
      }

      const htmlText = await response.text()

      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlText, "text/html")

      if (!doc) {
        throw new Error('Failed to parse HTML')
      }

      // Look for links to weddingcounselors.com
      const links = doc.querySelectorAll('a')
      for (let i = 0; i < links.length; i++) {
        const href = links[i].getAttribute('href')
        if (href && (href.includes('weddingcounselors.com/premarital-counseling') || href.includes('www.weddingcounselors.com/premarital-counseling'))) {
          isVerified = true
          break
        }
      }

    } catch (fetchError) {
      console.error('Error fetching source URL:', fetchError)
      errorMessage = fetchError.message || 'Could not fetch or parse the provided URL.'
    }

    const submissionStatus = isVerified ? 'verified' : 'rejected'
    const finalErrorMessage = isVerified ? null : (errorMessage || 'We could not find a link to WeddingCounselors.com on the provided page. Please ensure the badge code is added correctly and the page is publicly accessible.')

    // Assume we have getFullProfileUrl logic, but we can reconstruct loosely or just skip profile_url 
    // Wait, badge_submissions needs profile_url. Let's make one up based on profile data
    const getPublicProfileUrl = (p) => {
      if (!p) return '#'
      const stateSlug = String(p.state_province || '').toLowerCase().replace(/\s+/g, '-')
      const citySlug = String(p.city || '').toLowerCase().replace(/\s+/g, '-')
      return `https://www.weddingcounselors.com/premarital-counseling/${stateSlug}/${citySlug}/${p.id}`
    }

    // Insert submission record
    const { error: insertError } = await supabaseAdmin
      .from('badge_submissions')
      .insert({
        provider_id: profileId,
        profile_url: getPublicProfileUrl(profileData),
        source_url: sourceUrl,
        status: submissionStatus,
        notes: finalErrorMessage,
        checked_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error inserting badge submission:', insertError)
      throw new Error('Failed to save badge submission')
    }

    if (isVerified) {
      // Update profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          badge_verified: true,
          badge_verified_at: new Date().toISOString()
        })
        .eq('id', profileId)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw new Error('Failed to update verified status on profile')
      }
    }

    return new Response(
      JSON.stringify({
        success: isVerified,
        status: submissionStatus,
        error: finalErrorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
