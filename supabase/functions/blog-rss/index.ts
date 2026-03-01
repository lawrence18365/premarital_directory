import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const escapeXml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: posts, error } = await supabase
    .from('posts')
    .select('title, slug, excerpt, category, date, content')
    .eq('status', 'published')
    .order('date', { ascending: false })
    .limit(50)

  if (error) {
    return new Response('Error fetching posts', { status: 500 })
  }

  const siteUrl = 'https://www.weddingcounselors.com'
  const now = new Date().toUTCString()

  const items = (posts || []).map((post) => {
    const pubDate = post.date ? new Date(post.date).toUTCString() : now
    const description = post.excerpt || post.title
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(post.category || 'General')}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`
  }).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Wedding Counselors — Marriage &amp; Relationship Guidance</title>
    <link>${siteUrl}/blog</link>
    <description>Expert advice on premarital counseling, relationship preparation, and building strong marriages.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
