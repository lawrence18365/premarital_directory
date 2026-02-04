import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface RateLimitOptions {
  supabaseUrl: string
  serviceKey: string
  endpoint: string
  ipAddress: string
  windowSeconds: number
  maxRequests: number
}

export async function enforceRateLimit(options: RateLimitOptions) {
  const { supabaseUrl, serviceKey, endpoint, ipAddress, windowSeconds, maxRequests } = options

  if (!supabaseUrl || !serviceKey) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Server configuration missing' }), { status: 500 }) }
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  const { count, error } = await supabase
    .from('edge_request_logs')
    .select('*', { count: 'exact', head: true })
    .eq('endpoint', endpoint)
    .eq('ip_address', ipAddress)
    .gte('created_at', windowStart)

  if (error) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Rate limit check failed' }), { status: 500 }) }
  }

  if ((count || 0) >= maxRequests) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Retry-After': String(windowSeconds),
        },
      }),
    }
  }

  await supabase.from('edge_request_logs').insert({
    endpoint,
    ip_address: ipAddress,
  })

  return { ok: true }
}
