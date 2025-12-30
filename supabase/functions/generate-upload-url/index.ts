import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.370.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.370.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profileId, fileType } = await req.json()

    if (!profileId || !fileType) {
      throw new Error('Missing profileId or fileType')
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})