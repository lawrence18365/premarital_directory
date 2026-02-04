import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/auth.ts'

/**
 * Resend Webhook Handler
 * Handles bounces, complaints, and delivery events from Resend
 * Critical for maintaining sender reputation and respecting removals
 */

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
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    const origin = req.headers.get('origin')
    const secret = Deno.env.get('RESEND_WEBHOOK_SECRET')
    if (!secret) {
      return new Response(
        JSON.stringify({ error: 'RESEND_WEBHOOK_SECRET not configured' }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const payload = await req.text()
    const verified = await verifyWebhookSignature(req, payload, secret)
    if (!verified) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const event: ResendWebhookEvent = JSON.parse(payload)

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
            .update({ outreach_status: 'bounced' })
            .eq('email', email)

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
            .update({ outreach_status: 'unsubscribed' })
            .eq('email', email)

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
              outreach_status: 'emailed',
              last_contacted_at: event.created_at
            })
            .eq('email', email)

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
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function verifyWebhookSignature(req: Request, payload: string, secret: string) {
  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (svixId && svixTimestamp && svixSignature) {
    const timestamp = Number(svixTimestamp)
    if (!Number.isFinite(timestamp)) return false

    // 5 minute tolerance
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - timestamp) > 300) return false

    const signedPayload = `${svixId}.${svixTimestamp}.${payload}`
    const expected = await computeHmac(secret, signedPayload)

    const candidates = svixSignature
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => (part.startsWith('v1,') ? part.slice(3) : part))

    return candidates.some((candidate) => timingSafeEqual(candidate, expected))
  }

  // Fallback: allow a static secret header if configured on the sender
  const fallback = req.headers.get('x-webhook-secret')
  return Boolean(fallback && timingSafeEqual(fallback, secret))
}

async function computeHmac(secret: string, payload: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
