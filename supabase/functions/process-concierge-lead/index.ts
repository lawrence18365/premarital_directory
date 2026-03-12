import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6"
import { checkForSpam, silentSpamResponse } from "../_shared/spamDetection.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const PLATFORM_EMAIL = 'hello@weddingcounselors.com' // Send leads to platform owner

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
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Using service role key for admin inserts since public might be restricted or we want elevated access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const {
      name,
      email,
      phone,
      timeline,
      preference,
      message,
      city,
      state,
      sourceUrl,
      _hp,
      _t,
    } = payload

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Spam detection ---
    const spamCheck = checkForSpam({
      honeypot: _hp,
      elapsedMs: _t,
      name,
      message,
    })
    if (spamCheck.isSpam) {
      console.warn(`Spam concierge lead blocked (score=${spamCheck.score}, reason=${spamCheck.reason}):`, email)
      return silentSpamResponse(corsHeaders)
    }

    console.log(`Processing Concierge Lead from ${name} (${email}) for ${city}, ${state}`)

    // 1. Insert into platform_leads
    const { data: leadModel, error: insertError } = await supabaseAdmin
      .from('platform_leads')
      .insert({
        couple_name: name,
        couple_email: email,
        couple_phone: phone,
        timeline,
        preference,
        message,
        city,
        state,
        source_url: sourceUrl,
        status: 'new',
        email_delivery_status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting platform lead:', insertError)
      throw insertError
    }

    // 2. Send Email via Resend
    let deliveryStatus = 'failed'
    let deliveryError = null

    if (RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'WeddingCounselors <matchmaker@updates.weddingcounselors.com>',
            to: PLATFORM_EMAIL,
            reply_to: email,
            subject: `🚨 NEW CONCIERGE MATCH LEAD: ${city}, ${state}`,
            html: `
              <h2>New Concierge Lead Requires Matching</h2>
              <p>A couple has submitted a "Get Matched" request from the directory. You need to forward this to local verified counselors.</p>
              
              <h3>Couple Details:</h3>
              <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Phone:</strong> ${phone || 'Not provided'}</li>
              </ul>

              <h3>Request Details:</h3>
              <ul>
                <li><strong>Location:</strong> ${city}, ${state}</li>
                <li><strong>Therapy Style Preference:</strong> ${preference || 'Not specified'}</li>
                <li><strong>Timeline:</strong> ${timeline || 'Not specified'}</li>
              </ul>

              <h3>Message:</h3>
              <p style="padding: 12px; background: #f4f4f5; border-left: 4px solid #0e5e5e; border-radius: 4px;">
                ${message ? message.replace(/\\n/g, '<br/>') : 'No message provided.'}
              </p>

              <hr />
              <p style="font-size: 12px; color: #666;">
                Submitted from: ${sourceUrl}<br/>
                Lead ID: ${leadModel.id}
              </p>
            `
          })
        })

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Resend API: ${res.statusText} - ${errorText}`)
        }

        deliveryStatus = 'sent'
        console.log(`Email successfully sent to ${PLATFORM_EMAIL}`)
      } catch (e) {
        console.error('Resend delivery failed:', e)
        deliveryError = e.message
      }
    } else {
      console.error('No RESEND_API_KEY found, skipping email')
      deliveryError = 'Missing RESEND_API_KEY'
    }

    // 3. Update the lead delivery status
    await supabaseAdmin
      .from('platform_leads')
      .update({
        email_delivery_status: deliveryStatus,
        email_delivery_error: deliveryError
      })
      .eq('id', leadModel.id)

    return new Response(
      JSON.stringify({ success: true, lead: leadModel }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
