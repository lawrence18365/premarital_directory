import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.370.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.370.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { getCorsHeaders, requireUser } from "../_shared/auth.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    const { profileId, fileType } = await req.json()

    if (!profileId || !fileType) {
      throw new Error('Missing profileId or fileType')
    }

    if (!fileType.startsWith('image/')) {
      throw new Error('Only image uploads are allowed')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    const userResult = await requireUser(req, supabaseUrl, supabaseAnonKey)
    if (!userResult.ok) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    if (profile.user_id !== userResult.user.id) {
      const { data: adminUser } = await adminClient
        .from('admin_users')
        .select('id')
        .eq('id', userResult.user.id)
        .eq('is_active', true)
        .single()

      if (!adminUser) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
        )
      }
    }

    // Cloudflare R2 Config
    const accountId = Deno.env.get('R2_ACCOUNT_ID')
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const bucketName = Deno.env.get('R2_BUCKET_NAME')
    const publicDomain = Deno.env.get('R2_PUBLIC_DOMAIN') // e.g. https://media.weddingcounselors.com

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Server R2 configuration missing')
    }

    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    // Create unique filename
    const fileExt = fileType.split('/')[1] || 'jpg'
    const fileName = `${profileId}-${Date.now()}.${fileExt}`
    const key = `profiles/${fileName}`

    // Generate Presigned URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    })

    const uploadUrl = await getSignedUrl(S3, command, { expiresIn: 3600 }) // Valid for 1 hour

    return new Response(
      JSON.stringify({
        uploadUrl,
        publicUrl: `${publicDomain}/${key}`,
        key
      }),
      {
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      }
    )
  }
})
