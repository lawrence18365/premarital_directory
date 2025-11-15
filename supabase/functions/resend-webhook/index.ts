import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Resend Webhook Handler
 * Handles bounces, complaints, and delivery events from Resend
 * Critical for maintaining sender reputation and respecting removals
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResendWebhookEvent {
  type: string // 'email.bounced', 'email.complained', 'email.delivered'
  created_at: string
  data: {
    email_id: string
    to: string[]
    from: string
    subject: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const event: ResendWebhookEvent = await req.json()

    console.log('Received Resend webhook:', event.type)

    // Process based on event type
    switch (event.type) {
      case 'email.bounced': {
        // Email bounced - add to do_not_contact and update outreach status
        for (const email of event.data.to) {
          // Add to do_not_contact list
          await supabase.from('do_not_contact').upsert({
            email: email,
            reason: 'bounce',
            notes: `Email bounced on ${event.created_at}. Subject: ${event.data.subject}`
          }, {
            onConflict: 'email'
          })

          // Update outreach record
          await supabase
            .from('provider_outreach')
            .update({ status: 'bounced' })
            .eq('provider_email', email)

          // Log event
          await supabase.from('provider_events').insert({
            provider_email: email,
            event_type: 'bounce',
            event_data: {
              resend_email_id: event.data.email_id,
              subject: event.data.subject,
              bounced_at: event.created_at
            }
          })

          // Also hide any seeded profile for this email to avoid showing stale data
          await supabase
            .from('profiles')
            .update({
              is_hidden: true,
              hidden_reason: 'email_bounced',
              hidden_at: new Date().toISOString()
            })
            .eq('email', email)
            .eq('is_seeded', true)
            .eq('is_claimed', false)

          console.log(`Processed bounce for ${email}`)
        }
        break
      }

      case 'email.complained': {
        // User marked as spam - add to do_not_contact and hide profile
        for (const email of event.data.to) {
          await supabase.from('do_not_contact').upsert({
            email: email,
            reason: 'complaint',
            notes: `Marked as spam on ${event.created_at}. Subject: ${event.data.subject}`
          }, {
            onConflict: 'email'
          })

          // Update outreach record
          await supabase
            .from('provider_outreach')
            .update({ status: 'complained' })
            .eq('provider_email', email)

          // Log event
          await supabase.from('provider_events').insert({
            provider_email: email,
            event_type: 'complaint',
            event_data: {
              resend_email_id: event.data.email_id,
              subject: event.data.subject,
              complained_at: event.created_at
            }
          })

          // Hide any profile for this email (they clearly don't want to be listed)
          await supabase
            .from('profiles')
            .update({
              is_hidden: true,
              hidden_reason: 'spam_complaint',
              hidden_at: new Date().toISOString()
            })
            .eq('email', email)
            .eq('is_claimed', false)

          console.log(`Processed spam complaint for ${email}`)
        }
        break
      }

      case 'email.delivered': {
        // Successfully delivered - update outreach record
        for (const email of event.data.to) {
          await supabase
            .from('provider_outreach')
            .update({
              status: 'delivered',
              last_contacted_at: event.created_at
            })
            .eq('provider_email', email)

          // Log successful delivery
          await supabase.from('provider_events').insert({
            provider_email: email,
            event_type: 'email_delivered',
            event_data: {
              resend_email_id: event.data.email_id,
              subject: event.data.subject,
              delivered_at: event.created_at
            }
          })

          console.log(`Email delivered to ${email}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
