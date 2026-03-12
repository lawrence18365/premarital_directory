import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getAllowedOrigins, getCorsHeaders, getRequestIp, isOriginAllowed } from "../_shared/auth.ts"
import { enforceRateLimit } from "../_shared/rateLimit.ts"
import { checkForSpam, silentSpamResponse } from "../_shared/spamDetection.ts"

interface Attribution {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
    utm_term?: string
    ref?: string
    landing_page?: string
    referrer?: string | null
    captured_at?: string
}

interface ProcessLeadRequest {
    profileId: string | null
    professionalName?: string
    isProfileClaimed: boolean
    isSpecialtyMatching?: boolean
    isDiscountMatching?: boolean
    isStateMatching?: boolean
    specialtyType?: string
    stateName?: string
    source: string
    source_page?: string
    attribution?: Attribution
    coupleData: {
        partner_one_name: string
        partner_two_name?: string
        email: string
        phone?: string
        wedding_date?: string
        timeline?: string
        location?: string
        message: string
    }
    // Anti-spam fields (set by frontend)
    _hp?: string   // honeypot — must be empty
    _t?: number    // milliseconds elapsed since form loaded
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
    }

    try {
        const origin = req.headers.get('origin')
        const allowedOrigins = getAllowedOrigins()
        const requestIp = getRequestIp(req)

        // Strict CORS checking
        if (!isOriginAllowed(origin, allowedOrigins)) {
            return new Response(
                JSON.stringify({ success: false, error: 'Origin not allowed' }),
                { status: 403, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Rate limiting to prevent spam submissions
        const rateLimit = await enforceRateLimit({
            supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
            serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            endpoint: 'process-lead-submission',
            ipAddress: requestIp,
            windowSeconds: 3600,
            maxRequests: 5 // Max 5 leads per IP per hour
        })

        if (!rateLimit.ok) {
            return rateLimit.response
                ? new Response(await rateLimit.response.text(), {
                    status: rateLimit.response.status,
                    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
                })
                : new Response(JSON.stringify({ success: false, error: 'Too many requests' }), {
                    status: 429,
                    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
                })
        }

        const payload: ProcessLeadRequest = await req.json()
        const { profileId, coupleData, source, source_page, attribution, isProfileClaimed, isSpecialtyMatching, isDiscountMatching, isStateMatching, specialtyType, stateName, professionalName } = payload

        // Validation
        if (!coupleData.partner_one_name || !coupleData.email || !coupleData.message) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required fields' }),
                { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
            )
        }

        // --- Spam detection ---
        const coupleName = coupleData.partner_two_name
            ? `${coupleData.partner_one_name} ${coupleData.partner_two_name}`
            : coupleData.partner_one_name
        const spamCheck = checkForSpam({
            honeypot: payload._hp,
            elapsedMs: payload._t,
            name: coupleName,
            message: coupleData.message,
        })
        if (spamCheck.isSpam) {
            console.warn(`Spam lead blocked (score=${spamCheck.score}, reason=${spamCheck.reason}):`, coupleData.email)
            return silentSpamResponse(getCorsHeaders(origin))
        }

        // Prepare lead data for DB
        const timelinePrefix = coupleData.timeline ? `Timeline: ${coupleData.timeline}\n\n` : ''
        const outboundMessage = `${timelinePrefix}${coupleData.message}`
        const coupleName = coupleData.partner_two_name
            ? `${coupleData.partner_one_name} & ${coupleData.partner_two_name}`
            : coupleData.partner_one_name

        const isUnmatchedLead = !profileId
        const leadStatus = isProfileClaimed ? 'new' : 'pending_claim'

        // STEP 1: ATOMIC INSERT
        // We insert into the DB first. If this fails, the whole function fails, and the user gets a 500.
        const { data: leadData, error: insertError } = await supabaseClient
            .from('profile_leads')
            .insert([{
                profile_id: profileId,
                couple_name: coupleName,
                couple_email: coupleData.email,
                couple_phone: coupleData.phone,
                wedding_date: coupleData.wedding_date || null,
                location: coupleData.location,
                message: outboundMessage,
                source: source || 'direct',
                source_page: source_page || null,
                utm_source: attribution?.utm_source || null,
                utm_medium: attribution?.utm_medium || null,
                utm_campaign: attribution?.utm_campaign || null,
                partner_ref: attribution?.ref || null,
                referrer: attribution?.referrer || null,
                status: leadStatus,
                delivery_status: 'pending'
            }])
            .select()

        if (insertError || !leadData || leadData.length === 0) {
            console.error('Lead DB Insert Error:', insertError)
            throw new Error('Failed to save lead to database')
        }

        const leadId = leadData[0].id

        // STEP 2: NOTIFY PROVIDER
        try {
            let invokeResult: { data: unknown; error: unknown }

            if (isUnmatchedLead) {
                // Unmatched lead (from state/specialty/discount pages) - Route to Admin
                const matchContext = isDiscountMatching ? 'Marriage License Discount'
                    : isSpecialtyMatching ? (specialtyType || 'Specialty')
                        : isStateMatching ? (stateName || 'State')
                            : 'General'

                invokeResult = await supabaseClient.functions.invoke('send-lead-notification', {
                    body: {
                        leadId,
                        profileId: null,
                        isUnmatchedLead: true,
                        matchContext,
                        requestIp,
                        coupleData: {
                            name: coupleName,
                            email: coupleData.email,
                            phone: coupleData.phone,
                            wedding_date: coupleData.wedding_date,
                            timeline: coupleData.timeline,
                            location: coupleData.location,
                            message: outboundMessage
                        }
                    }
                })
            } else if (isProfileClaimed) {
                // Standard notification for claimed profiles
                invokeResult = await supabaseClient.functions.invoke('send-lead-notification', {
                    body: {
                        leadId,
                        profileId,
                        requestIp,
                        coupleData: {
                            name: coupleName,
                            email: coupleData.email,
                            phone: coupleData.phone,
                            wedding_date: coupleData.wedding_date,
                            timeline: coupleData.timeline,
                            location: coupleData.location,
                            message: outboundMessage
                        }
                    }
                })
            } else {
                // Email for UNCLAIMED profiles
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('slug, city, state_province')
                    .eq('id', profileId)
                    .single()

                invokeResult = await supabaseClient.functions.invoke('email-unclaimed-profile-owner', {
                    body: {
                        profileId,
                        profileSlug: profile?.slug,
                        professionalName,
                        coupleName,
                        coupleEmail: coupleData.email,
                        coupleLocation: coupleData.location,
                        city: profile?.city,
                        state: profile?.state_province,
                        claimUrl: `https://www.weddingcounselors.com/claim-profile/${profile?.slug || profileId}?utm_source=email&utm_medium=lead_intercept&utm_campaign=claim_profile`,
                    }
                })
            }

            // Check if the invoked function returned an error
            if (invokeResult.error) {
                const errMsg = typeof invokeResult.error === 'string'
                    ? invokeResult.error
                    : (invokeResult.error as Error)?.message || JSON.stringify(invokeResult.error)
                console.error('Notification function returned error:', errMsg)
                throw new Error(`Notification failed: ${errMsg}`)
            }

            // Verify the downstream function reported success
            const responseData = invokeResult.data as Record<string, unknown> | null
            if (responseData && responseData.success === false) {
                const errMsg = (responseData.error as string) || 'Notification function returned failure'
                console.error('Notification function returned failure:', errMsg)
                throw new Error(errMsg)
            }

            // If we reach here, email was successfully handed off to the notification functions
            await supabaseClient
                .from('profile_leads')
                .update({ delivery_status: 'delivered' })
                .eq('id', leadId)

            return new Response(
                JSON.stringify({ success: true, lead: leadData[0] }),
                { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
            )

        } catch (notificationError) {
            console.error('Failed to notify provider for lead:', leadId, notificationError)

            // Update delivery status so an admin or cron job can retry
            await supabaseClient
                .from('profile_leads')
                .update({
                    delivery_status: 'failed',
                    delivery_error: notificationError.message
                })
                .eq('id', leadId)

            // Even if notification fails, the lead is safely in the DB.
            // We return success to the client so the couple isn't told to retry infinitely.
            return new Response(
                JSON.stringify({ success: true, lead: leadData[0], warning: 'Email notification delayed' }),
                { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
            )
        }

    } catch (error) {
        console.error('Fatal edge function error:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'Internal server error processing lead' }),
            { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
        )
    }
})
