# Cloudflare R2 Headshot Setup

This app uploads profile headshots to Cloudflare R2 using the Supabase Edge Function `generate-upload-url`.

## Flow
1. `ProfileEditor` or `CreateProfilePage` calls `profileOperations.uploadPhoto`.
2. Supabase function `generate-upload-url` returns a presigned PUT URL and a public URL.
3. The browser uploads directly to R2.
4. The profile record saves `photo_url` and the UI renders it on profile cards and pages.

## Cloudflare R2 Setup
1. Create an R2 bucket (example: `premarital-headshots`).
2. Create an R2 API token with Read + Write for that bucket.
3. Enable public access:
   - Either enable the bucket public endpoint (r2.dev), or
   - Configure a custom domain (recommended) and use it as the public base URL.
4. Configure CORS for direct browser uploads. Example:

```json
[
  {
    "AllowedOrigins": ["https://www.weddingcounselors.com"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```

## Supabase Function Environment Variables
Set these for the `generate-upload-url` function:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_DOMAIN`

`R2_PUBLIC_DOMAIN` should be the base URL where uploaded images are publicly accessible
(example: `https://media.weddingcounselors.com`).

## Deploy the Function
Deploy `generate-upload-url` after setting env vars:

```bash
supabase functions deploy generate-upload-url
```

## Verify
- Upload a headshot from the profile editor.
- Confirm `photo_url` points to:
  `R2_PUBLIC_DOMAIN/profiles/<profileId>-<timestamp>.<ext>`
- Confirm the image loads in the profile card and profile page.
