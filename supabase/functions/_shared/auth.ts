import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

export const defaultCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function getAllowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS') || ''
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!allowedOrigins.length) return true
  if (!origin) return false
  return allowedOrigins.includes(origin)
}

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const headers: Record<string, string> = { ...defaultCorsHeaders }
  if (origin) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

export function getRequestIp(req: Request): string {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export function requireInternalKey(req: Request, envName = 'INTERNAL_API_KEY') {
  const expected = Deno.env.get(envName)
  const provided = req.headers.get('x-internal-api-key') || ''
  if (!expected) {
    return { ok: false, response: new Response(JSON.stringify({ error: `${envName} not configured` }), { status: 500 }) }
  }
  if (provided !== expected) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) }
  }
  return { ok: true }
}

export async function getUserFromRequest(req: Request, supabaseUrl: string, supabaseAnonKey: string) {
  const authHeader = req.headers.get('authorization') || ''
  if (!authHeader) return { user: null }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  })

  const { data, error } = await supabase.auth.getUser()
  if (error) return { user: null, error }
  return { user: data.user }
}

export async function requireUser(req: Request, supabaseUrl: string, supabaseAnonKey: string) {
  const { user } = await getUserFromRequest(req, supabaseUrl, supabaseAnonKey)
  if (!user) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) }
  }
  return { ok: true, user }
}

export async function requireAdmin(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string,
  supabaseServiceKey: string
) {
  const userResult = await requireUser(req, supabaseUrl, supabaseAnonKey)
  if (!userResult.ok) return { ok: false, response: userResult.response }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  const { data, error } = await adminClient
    .from('admin_users')
    .select('id, is_active')
    .eq('id', userResult.user.id)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }) }
  }

  return { ok: true, user: userResult.user }
}
