#!/usr/bin/env node

/**
 * Focused Sitemap Generator for Wedding Counselors
 *
 * Generates sitemaps ONLY for:
 * - Anchor cities (high-priority SEO focus)
 * - Blog posts (content marketing)
 * - Core pages (home, about, pricing, etc.)
 *
 * Cities are ordered by profile count - more profiles = higher priority
 * This creates an incentive for providers to complete their profiles
 *
 * Run this as part of build: npm run build:sitemap
 */

const fs = require('fs')
const path = require('path')

// Try to load Supabase client (optional - for dynamic priority calculation)
let createClient = null
try {
  createClient = require('@supabase/supabase-js').createClient
} catch (err) {
  console.log('Note: @supabase/supabase-js not available, using default priorities')
}

// Import location config (we'll inline the anchor cities here for Node.js compatibility)
const ANCHOR_CITIES = [
  { stateSlug: 'texas', citySlug: 'austin', cityName: 'Austin', state: 'TX' },
  { stateSlug: 'texas', citySlug: 'dallas', cityName: 'Dallas', state: 'TX' },
  { stateSlug: 'texas', citySlug: 'houston', cityName: 'Houston', state: 'TX' },
  { stateSlug: 'california', citySlug: 'los-angeles', cityName: 'Los Angeles', state: 'CA' },
  { stateSlug: 'california', citySlug: 'san-francisco', cityName: 'San Francisco', state: 'CA' },
  { stateSlug: 'new-york', citySlug: 'new-york', cityName: 'New York', state: 'NY' },
  { stateSlug: 'florida', citySlug: 'miami', cityName: 'Miami', state: 'FL' },
  { stateSlug: 'illinois', citySlug: 'chicago', cityName: 'Chicago', state: 'IL' },
  { stateSlug: 'georgia', citySlug: 'atlanta', cityName: 'Atlanta', state: 'GA' },
  { stateSlug: 'colorado', citySlug: 'denver', cityName: 'Denver', state: 'CO' }
]

const CORE_PAGES = [
  { url: '/', priority: 1.0, changefreq: 'weekly' },
  { url: '/premarital-counseling', priority: 0.9, changefreq: 'daily' },
  { url: '/blog', priority: 0.8, changefreq: 'daily' },
  { url: '/pricing', priority: 0.7, changefreq: 'monthly' },
  { url: '/features', priority: 0.7, changefreq: 'monthly' },
  { url: '/about', priority: 0.6, changefreq: 'monthly' },
  { url: '/contact', priority: 0.6, changefreq: 'monthly' },
  { url: '/support', priority: 0.6, changefreq: 'monthly' },
  { url: '/guidelines', priority: 0.5, changefreq: 'monthly' },
  { url: '/professional/signup', priority: 0.8, changefreq: 'monthly' },
  { url: '/professional/login', priority: 0.6, changefreq: 'monthly' }
]

// Known blog posts (add more as they're created)
const BLOG_POSTS = [
  { slug: 'financial-questions-before-marriage', priority: 0.8 },
  { slug: 'wedding-planning-fights', priority: 0.8 },
  { slug: 'inlaw-boundaries', priority: 0.8 }
]

const DOMAIN = 'https://www.weddingcounselors.com'

function generateSitemapXML(urls) {
  const today = new Date().toISOString().split('T')[0]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  urls.forEach(({ url, priority = 0.5, changefreq = 'weekly', lastmod = today }) => {
    xml += '  <url>\n'
    xml += `    <loc>${DOMAIN}${url}</loc>\n`
    xml += `    <lastmod>${lastmod}</lastmod>\n`
    xml += `    <changefreq>${changefreq}</changefreq>\n`
    xml += `    <priority>${priority.toFixed(1)}</priority>\n`
    xml += '  </url>\n'
  })

  xml += '</urlset>'
  return xml
}

function generateSitemapIndex(sitemaps) {
  const today = new Date().toISOString().split('T')[0]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  sitemaps.forEach(sitemap => {
    xml += '  <sitemap>\n'
    xml += `    <loc>${DOMAIN}/${sitemap}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += '  </sitemap>\n'
  })

  xml += '</sitemapindex>'
  return xml
}

// Calculate priority based on profile count (0.7 to 0.95 range)
function calculatePriority(profileCount, maxCount) {
  if (maxCount === 0) return 0.8 // Default if no profiles

  // Scale from 0.7 (0 profiles) to 0.95 (max profiles)
  const baselinePriority = 0.7
  const maxPriority = 0.95
  const scaleFactor = (maxPriority - baselinePriority) * (profileCount / maxCount)

  return Math.min(maxPriority, baselinePriority + scaleFactor)
}

async function fetchProfileCounts() {
  if (!createClient) {
    console.log('⚠️  Supabase client not available, using default priorities')
    return null
  }

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('⚠️  Supabase credentials not found, using default priorities')
    return null
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Fetch all profiles and count by city/state
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('city, state_province')

    if (error) {
      console.log('⚠️  Error fetching profiles:', error.message)
      return null
    }

    // Count profiles per city/state combination
    const cityCounts = {}
    profiles.forEach(profile => {
      if (profile.city && profile.state_province) {
        const key = `${profile.city.toLowerCase()}|${profile.state_province}`
        cityCounts[key] = (cityCounts[key] || 0) + 1
      }
    })

    return cityCounts
  } catch (err) {
    console.log('⚠️  Failed to connect to Supabase:', err.message)
    return null
  }
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public')
  const today = new Date().toISOString().split('T')[0]

  console.log('🗺️  Generating focused sitemaps...')

  // Fetch profile counts from Supabase
  const profileCounts = await fetchProfileCounts()

  // 1. Core pages sitemap
  const coreUrls = CORE_PAGES.map(page => ({
    ...page,
    lastmod: today
  }))

  const coreSitemap = generateSitemapXML(coreUrls)
  fs.writeFileSync(path.join(publicDir, 'sitemap-core.xml'), coreSitemap)
  console.log(`✅ Generated sitemap-core.xml (${coreUrls.length} URLs)`)

  // 2. Anchor cities sitemap (ordered by profile count)
  const cityUrls = []

  // Calculate profile counts for anchor cities
  const anchorCitiesWithCounts = ANCHOR_CITIES.map(city => {
    const key = `${city.cityName.toLowerCase()}|${city.state}`
    const count = profileCounts ? (profileCounts[key] || 0) : 0
    return { ...city, profileCount: count }
  })

  // Sort by profile count (descending)
  anchorCitiesWithCounts.sort((a, b) => b.profileCount - a.profileCount)

  // Find max count for priority calculation
  const maxProfileCount = Math.max(...anchorCitiesWithCounts.map(c => c.profileCount), 1)

  // Log profile counts
  if (profileCounts) {
    console.log('\n📊 Profile counts per anchor city:')
    anchorCitiesWithCounts.forEach(city => {
      console.log(`   ${city.cityName}, ${city.state}: ${city.profileCount} profiles`)
    })
  }

  // Add state pages for anchor states
  const anchorStates = [...new Set(anchorCitiesWithCounts.map(c => c.stateSlug))]
  anchorStates.forEach(stateSlug => {
    cityUrls.push({
      url: `/premarital-counseling/${stateSlug}`,
      priority: 0.8,
      changefreq: 'weekly',
      lastmod: today
    })
  })

  // Add anchor city pages with dynamic priorities based on profile count
  anchorCitiesWithCounts.forEach(city => {
    const priority = calculatePriority(city.profileCount, maxProfileCount)
    cityUrls.push({
      url: `/premarital-counseling/${city.stateSlug}/${city.citySlug}`,
      priority: priority,
      changefreq: 'daily',
      lastmod: today
    })
  })

  const citySitemap = generateSitemapXML(cityUrls)
  fs.writeFileSync(path.join(publicDir, 'sitemap-cities.xml'), citySitemap)
  console.log(`\n✅ Generated sitemap-cities.xml (${cityUrls.length} URLs - anchor cities only)`)

  // 3. Blog posts sitemap
  const blogUrls = BLOG_POSTS.map(post => ({
    url: `/blog/${post.slug}`,
    priority: post.priority,
    changefreq: 'monthly',
    lastmod: today
  }))

  const blogSitemap = generateSitemapXML(blogUrls)
  fs.writeFileSync(path.join(publicDir, 'sitemap-blog.xml'), blogSitemap)
  console.log(`✅ Generated sitemap-blog.xml (${blogUrls.length} URLs)`)

  // 4. Main sitemap index
  const sitemapIndex = generateSitemapIndex([
    'sitemap-core.xml',
    'sitemap-cities.xml',
    'sitemap-blog.xml'
  ])
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapIndex)
  console.log(`✅ Generated sitemap.xml (index file)`)

  // Summary
  const totalUrls = coreUrls.length + cityUrls.length + blogUrls.length
  console.log(`\n📊 Total URLs in sitemap: ${totalUrls}`)
  console.log('   - Core pages:', coreUrls.length)
  console.log('   - Anchor city pages:', cityUrls.length)
  console.log('   - Blog posts:', blogUrls.length)
  console.log('\n🎯 Focused on anchor cities for SEO authority building')
  console.log('🏆 Cities with more profiles get higher sitemap priority')
}

main().catch(err => {
  console.error('Error generating sitemap:', err)
  process.exit(1)
})
