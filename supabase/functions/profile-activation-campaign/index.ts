import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CampaignConfig {
  emailsPerHour?: number
  maxMonthlyEmails?: number
  campaign?: string
  testMode?: boolean
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

    // Get configuration from request body
    const config: CampaignConfig = await req.json()
    const {
      emailsPerHour = 33, // ~1000/month = 33/day max
      maxMonthlyEmails = 1000,
      campaign = 'profile-activation-v1',
      testMode = false
    } = config

    console.log('Starting profile activation campaign:', {
      emailsPerHour,
      maxMonthlyEmails,
      campaign,
      testMode
    })

    // Create campaign logs table if it doesn't exist
    await supabase.rpc('create_campaign_logs_table')

    // Check monthly email limit (SMTP2GO limit: 1000/month)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
    
    const { data: monthlyEmails } = await supabase
      .from('campaign_logs')
      .select('id')
      .eq('campaign', campaign)
      .gte('sent_at', monthStart)
      .lt('sent_at', monthEnd)

    const emailsSentThisMonth = monthlyEmails?.length || 0
    
    if (emailsSentThisMonth >= maxMonthlyEmails) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: `Monthly email limit reached: ${emailsSentThisMonth}/${maxMonthlyEmails}. Limit resets next month.`,
          emailsSentThisMonth,
          limitResetsOn: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get profiles that haven't been contacted yet for this campaign
    const { data: uncontactedProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, profession, city, state_province')
      .eq('is_verified', false) // Only unverified profiles
      .not('email', 'is', null) // Must have email
      .not('email', 'eq', '') // Email cannot be empty
      .limit(emailsPerHour)

    if (!uncontactedProfiles || uncontactedProfiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No profiles available to contact',
          emailsSent: 0,
          emailsSentThisMonth
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Filter out profiles that have already been contacted for this campaign
    const profileIds = uncontactedProfiles.map(p => p.id)
    const { data: contactedProfiles } = await supabase
      .from('campaign_logs')
      .select('profile_id')
      .eq('campaign', campaign)
      .in('profile_id', profileIds)

    const contactedIds = new Set(contactedProfiles?.map(log => log.profile_id) || [])
    const profilesToContact = uncontactedProfiles.filter(p => !contactedIds.has(p.id))

    if (profilesToContact.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'All available profiles have already been contacted',
          emailsSent: 0,
          emailsSentThisMonth
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Limit to remaining daily quota
    const remainingMonthlyQuota = maxMonthlyEmails - emailsSentThisMonth
    const emailsToSend = Math.min(profilesToContact.length, emailsPerHour, remainingMonthlyQuota)
    const finalProfilesToContact = profilesToContact.slice(0, emailsToSend)

    console.log(`Sending emails to ${finalProfilesToContact.length} profiles`)

    let emailsSent = 0
    let emailsErrored = 0

    // Send emails to each profile
    for (const profile of finalProfilesToContact) {
      try {
        // Generate random view count for realism
        const viewCount = Math.floor(Math.random() * 30) + 25 // 25-54 views

        // Call the email sending function
        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-profile-activation-email`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profileId: profile.id,
              email: testMode ? 'haylee@weddingcounselors.com' : profile.email,
              name: profile.full_name,
              profession: profile.profession,
              city: profile.city,
              state: profile.state_province,
              viewCount
            })
          }
        )

        const emailResult = await emailResponse.json()

        if (emailResponse.ok && emailResult.success) {
          // Log successful email
          await supabase
            .from('campaign_logs')
            .insert({
              profile_id: profile.id,
              campaign: campaign,
              email: testMode ? 'haylee@weddingcounselors.com' : profile.email,
              status: 'sent',
              sent_at: new Date().toISOString(),
              email_request_id: emailResult.requestId,
              test_mode: testMode
            })

          emailsSent++
          console.log(`Email sent to ${profile.full_name} (${profile.email})`)
        } else {
          throw new Error(emailResult.error || 'Email sending failed')
        }

      } catch (error) {
        console.error(`Failed to send email to ${profile.full_name}:`, error)
        
        // Log failed email
        await supabase
          .from('campaign_logs')
          .insert({
            profile_id: profile.id,
            campaign: campaign,
            email: testMode ? 'haylee@weddingcounselors.com' : profile.email,
            status: 'failed',
            sent_at: new Date().toISOString(),
            error_message: error.message,
            test_mode: testMode
          })

        emailsErrored++
      }

      // Add small delay between emails to avoid rate limits
      if (!testMode) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const summary = {
      success: true,
      message: `Campaign batch completed`,
      emailsSent,
      emailsErrored,
      emailsSentThisMonth: emailsSentThisMonth + emailsSent,
      totalProfilesChecked: uncontactedProfiles.length,
      profilesAlreadyContacted: contactedIds.size,
      profilesAvailable: profilesToContact.length,
      campaign,
      testMode
    }

    console.log('Campaign batch summary:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in profile activation campaign:', error)
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