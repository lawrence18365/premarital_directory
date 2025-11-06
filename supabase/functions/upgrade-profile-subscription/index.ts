import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpgradeRequest {
  profileId: string
  planName: 'Free' | 'Featured' | 'Premium'
  subscriptionId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { profileId, planName, subscriptionId }: UpgradeRequest = await req.json()

    if (!profileId || !planName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: profileId, planName' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Determine sponsored_rank and is_sponsored based on plan
    let sponsored_rank = 0
    let is_sponsored = false
    let is_verified = true // All paid plans are verified

    switch (planName) {
      case 'Premium':
        sponsored_rank = 3
        is_sponsored = true
        break
      case 'Featured':
        sponsored_rank = 2
        is_sponsored = true
        break
      case 'Free':
        sponsored_rank = 0
        is_sponsored = false
        is_verified = false // Free profiles are not verified by default
        break
    }

    // Update the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        sponsored_rank,
        is_sponsored,
        is_verified,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update profile',
          details: profileError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If subscription ID provided, record it (for Stripe integration)
    if (subscriptionId && planName !== 'Free') {
      const { error: subscriptionError } = await supabase
        .from('professional_subscriptions')
        .upsert({
          profile_id: profileId,
          subscription_id: subscriptionId,
          plan_name: planName,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          updated_at: new Date().toISOString()
        })

      if (subscriptionError) {
        console.warn('Error recording subscription:', subscriptionError)
        // Don't fail the whole request for this
      }
    }

    console.log(`Profile ${profileId} upgraded to ${planName} (rank: ${sponsored_rank})`)

    // Send welcome email for paid upgrades
    if (planName !== 'Free' && profile.email) {
      try {
        await supabase.functions.invoke('send-upgrade-confirmation-email', {
          body: {
            email: profile.email,
            name: profile.full_name,
            planName,
            profileUrl: `https://weddingcounselors.com/profile/${profile.slug || profile.id}`
          }
        })
      } catch (emailError) {
        console.warn('Error sending upgrade confirmation email:', emailError)
        // Don't fail the request for email issues
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Profile successfully upgraded to ${planName}`,
        profile: {
          id: profile.id,
          sponsored_rank: profile.sponsored_rank,
          is_sponsored: profile.is_sponsored,
          is_verified: profile.is_verified
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error upgrading profile subscription:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})