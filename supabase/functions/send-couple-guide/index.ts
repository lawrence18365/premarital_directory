import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

/**
 * Send Couple Guide — triggers immediately when a couple subscribes.
 * Sends the "10 Questions" guide via email and marks guide_sent_at.
 *
 * This is a PUBLIC endpoint (no internal key needed) because it's
 * called directly from the frontend after form submission.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await req.json()
    const { email, first_name, interest, city, state } = body

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const name = first_name?.trim() || ''
    const firstName = name || 'there'

    // Check if guide already sent
    const { data: existing } = await supabase
      .from('couple_subscribers')
      .select('guide_sent_at')
      .eq('email', normalizedEmail)
      .single()

    if (existing?.guide_sent_at) {
      return new Response(JSON.stringify({ success: true, already_sent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build location-aware content
    const locationStr = city && state ? `${city}, ${state}` : city || state || 'your area'
    const directoryLink = city && state
      ? `https://www.weddingcounselors.com/premarital-counseling/${state.toLowerCase().replace(/\s+/g, '-')}/${city.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`
      : 'https://www.weddingcounselors.com/premarital-counseling'

    const interestLabel = interest === 'officiant' ? 'a wedding officiant'
      : interest === 'both' ? 'premarital counseling and a wedding officiant'
      : 'premarital counseling'

    const guideHtml = generateGuideEmail({ firstName, locationStr, directoryLink, interestLabel })

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wedding Counselors <hello@weddingcounselors.com>',
        to: [normalizedEmail],
        subject: `${firstName}, here's your guide — 10 Questions Every Couple Should Discuss`,
        html: guideHtml,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Resend ${res.status}: ${errText}`)
    }

    // Mark as sent
    await supabase
      .from('couple_subscribers')
      .update({ guide_sent_at: new Date().toISOString() })
      .eq('email', normalizedEmail)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Send couple guide error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

interface GuideEmailData {
  firstName: string
  locationStr: string
  directoryLink: string
  interestLabel: string
}

function generateGuideEmail(data: GuideEmailData): string {
  const { firstName, locationStr, directoryLink, interestLabel } = data

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

      <div style="padding: 32px 24px;">
        <h1 style="color: #0d9488; font-size: 22px; margin: 0 0 16px;">
          Hi ${firstName} — here's your guide.
        </h1>

        <p style="font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
          You told us you're looking for ${interestLabel} near ${locationStr}. Before we help you find the right person, here are the 10 conversations that matter most.
        </p>

        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; margin: 0 0 16px; color: #111827;">
            10 Questions Every Couple Should Discuss Before Marriage
          </h2>

          <div style="font-size: 14px; line-height: 1.8; color: #374151;">
            <p style="margin: 0 0 12px;"><strong>1. How will we handle money?</strong><br>
            Who pays what? Joint accounts or separate? What's your debt situation? Financial disagreements are the #1 predictor of divorce. Get aligned now.</p>

            <p style="margin: 0 0 12px;"><strong>2. What does "family" look like to each of us?</strong><br>
            Do you want children? How many? When? What if one of you changes your mind? What role do your parents and in-laws play?</p>

            <p style="margin: 0 0 12px;"><strong>3. How do we fight?</strong><br>
            Do you shut down or blow up? Do you need space or immediate resolution? Understanding each other's conflict style prevents years of frustration.</p>

            <p style="margin: 0 0 12px;"><strong>4. What are our non-negotiables?</strong><br>
            Faith practices, where you live, career ambitions, lifestyle choices. Know each other's dealbreakers before they surprise you.</p>

            <p style="margin: 0 0 12px;"><strong>5. How will we divide household responsibilities?</strong><br>
            Cooking, cleaning, yard work, car maintenance, mental load. Unspoken expectations become resentment fast.</p>

            <p style="margin: 0 0 12px;"><strong>6. What does intimacy mean to each of us?</strong><br>
            Physical, emotional, and spiritual intimacy. Frequency, boundaries, how to communicate when needs aren't being met.</p>

            <p style="margin: 0 0 12px;"><strong>7. How will we handle hard seasons?</strong><br>
            Job loss, illness, miscarriage, grief, relocation. Do you lean in together or retreat? Having a plan matters.</p>

            <p style="margin: 0 0 12px;"><strong>8. What are our goals for the first 5 years?</strong><br>
            Career milestones, buying a home, travel, education, starting a family. Make sure you're building toward the same future.</p>

            <p style="margin: 0 0 12px;"><strong>9. How do we stay connected when life gets busy?</strong><br>
            Date nights, daily rituals, screen time boundaries, how you'll prioritize the relationship when work and kids compete.</p>

            <p style="margin: 0 0 12px;"><strong>10. Are we willing to get help when we need it?</strong><br>
            The strongest couples are the ones who ask for help early — not as a last resort. Premarital counseling is a sign of strength, not weakness.</p>
          </div>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px; font-size: 16px; color: #166534;">Ready to talk through these with a professional?</h3>
          <p style="margin: 0 0 14px; font-size: 14px; color: #4b5563; line-height: 1.6;">
            A good premarital counselor will guide you through all 10 of these topics — and help you discover things about each other you never thought to ask.
          </p>
          <a href="${directoryLink}" style="display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Browse Counselors Near ${locationStr}
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          Over the next week, we'll send you a couple more emails with
          personalized tips and counselor recommendations for ${locationStr}.
          If you'd rather not hear from us, just hit unsubscribe below.
        </p>

        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
          Wishing you both the best,<br>
          <strong>The Wedding Counselors Team</strong>
        </p>
      </div>

      <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
        <a href="https://www.weddingcounselors.com" style="color: #6b7280;">WeddingCounselors.com</a> &middot;
        <a href="https://www.weddingcounselors.com/unsubscribe" style="color: #6b7280;">Unsubscribe</a>
      </div>
    </div>
  `
}
