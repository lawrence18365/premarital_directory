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

// Import location config from JSON to ensure we capture ALL cities, not just anchors
const { STATE_CONFIG, CITY_CONFIG } = require('../src/data/locations.json')

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
function calculatePriority(profileCount, maxCount, isAnchor) {
  const base = isAnchor ? 0.8 : 0.6
  if (maxCount === 0) return base

  // Add boost for profiles
  const boost = (profileCount / maxCount) * 0.15
  return Math.min(0.95, base + boost)
}

async function fetchProfileCounts() {
  if (!createClient) {
    console.log('⚠️  Supabase client not available, using default priorities')
    return { cityCounts: null, profiles: [] }
  }

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('⚠️  Supabase credentials not found, using default priorities')
    return { cityCounts: null, profiles: [] }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Fetch all profiles with their slugs for sitemap
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, slug, city, state_province, full_name, updated_at, is_hidden')
      .eq('is_hidden', false)
      .order('updated_at', { ascending: false })

    if (error) {
      console.log('⚠️  Error fetching profiles:', error.message)
      return { cityCounts: null, profiles: [] }
    }

    // Count profiles per city/state combination
    const cityCounts = {}
    profiles.forEach(profile => {
      if (profile.city && profile.state_province) {
        const key = `${profile.city.toLowerCase()}|${getStateSlug(profile.state_province)}`
        cityCounts[key] = (cityCounts[key] || 0) + 1
      }
    })

    return { cityCounts, profiles: profiles || [] }
  } catch (err) {
    console.log('⚠️  Failed to connect to Supabase:', err.message)
    return { cityCounts: null, profiles: [] }
  }
}

// Helper to generate state slug
function getStateSlug(stateName) {
  const stateMap = {
    'TX': 'texas', 'CA': 'california', 'NY': 'new-york', 'FL': 'florida',
    'IL': 'illinois', 'GA': 'georgia', 'CO': 'colorado', 'PA': 'pennsylvania',
    'AZ': 'arizona', 'WA': 'washington', 'NC': 'north-carolina', 'NJ': 'new-jersey',
    'VA': 'virginia', 'MA': 'massachusetts', 'MI': 'michigan', 'OH': 'ohio',
    'TN': 'tennessee', 'IN': 'indiana', 'MO': 'missouri', 'MD': 'maryland',
    'WI': 'wisconsin', 'MN': 'minnesota', 'SC': 'south-carolina', 'AL': 'alabama',
    'LA': 'louisiana', 'KY': 'kentucky', 'OR': 'oregon', 'OK': 'oklahoma',
    'CT': 'connecticut', 'IA': 'iowa', 'UT': 'utah', 'NV': 'nevada',
    'AR': 'arkansas', 'MS': 'mississippi', 'KS': 'kansas', 'NM': 'new-mexico',
    'NE': 'nebraska', 'WV': 'west-virginia', 'ID': 'idaho', 'HI': 'hawaii',
    'NH': 'new-hampshire', 'ME': 'maine', 'MT': 'montana', 'RI': 'rhode-island',
    'DE': 'delaware', 'SD': 'south-dakota', 'ND': 'north-dakota', 'AK': 'alaska',
    'VT': 'vermont', 'WY': 'wyoming', 'DC': 'washington-dc'
  }
  return stateMap[stateName] || stateName.toLowerCase().replace(/\s+/g, '-')
}

// Helper to generate city slug
function getCitySlug(cityName) {
  return cityName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public')
  const today = new Date().toISOString().split('T')[0]

  console.log('🗺️  Generating comprehensive sitemaps...')

  // Fetch profile counts and profiles from Supabase
  const { cityCounts: profileCounts, profiles: allProfiles } = await fetchProfileCounts()

  // 1. Core pages sitemap
  const coreUrls = CORE_PAGES.map(page => ({
    ...page,
    lastmod: today
  }))

  const coreSitemap = generateSitemapXML(coreUrls)
  fs.writeFileSync(path.join(publicDir, 'sitemap-core.xml'), coreSitemap)
  console.log(`✅ Generated sitemap-core.xml (${coreUrls.length} URLs)`)

  // 2. All Cities Sitemap (Expanded from just anchor cities)
  const cityUrls = []
  
  // Flatten all cities from STATE_CONFIG
  const allCities = []
  Object.keys(STATE_CONFIG).forEach(stateSlug => {
    const stateData = STATE_CONFIG[stateSlug]
    // Add State Page
    cityUrls.push({
      url: `/premarital-counseling/${stateSlug}`,
      priority: 0.8,
      changefreq: 'weekly',
      lastmod: today
    })

    // Add City Pages
    stateData.major_cities.forEach(cityName => {
      allCities.push({
        stateSlug,
        stateName: stateData.name,
        cityName,
        citySlug: getCitySlug(cityName)
      })
    })
  })

  // Calculate stats for priorities
  let maxProfileCount = 1
  if (profileCounts) {
    const counts = Object.values(profileCounts)
    if (counts.length > 0) maxProfileCount = Math.max(...counts)
  }

  // Generate URLs for all cities
  allCities.forEach(city => {
    const key = `${city.cityName.toLowerCase()}|${city.stateSlug}`
    const profileCount = profileCounts ? (profileCounts[key] || 0) : 0
    
    // Check if it's an anchor city in CITY_CONFIG
    const isAnchor = CITY_CONFIG[city.stateSlug]?.[city.citySlug]?.is_anchor === true
    
    const priority = calculatePriority(profileCount, maxProfileCount, isAnchor)
    
    cityUrls.push({
      url: `/premarital-counseling/${city.stateSlug}/${city.citySlug}`,
      priority: priority,
      changefreq: 'daily',
      lastmod: today
    })
  })

  const citySitemap = generateSitemapXML(cityUrls)
  fs.writeFileSync(path.join(publicDir, 'sitemap-cities.xml'), citySitemap)
  console.log(`\n✅ Generated sitemap-cities.xml (${cityUrls.length} URLs - ALL configured cities)`)

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

  // 4. NEW: Profile URLs sitemap (individual professional profiles)
  const profileUrls = []
  if (allProfiles && allProfiles.length > 0) {
    allProfiles.forEach(profile => {
      if (profile.slug && profile.city && profile.state_province) {
        const stateSlug = getStateSlug(profile.state_province)
        const citySlug = getCitySlug(profile.city)
        const lastmod = profile.updated_at
          ? new Date(profile.updated_at).toISOString().split('T')[0]
          : today

        profileUrls.push({
          url: `/premarital-counseling/${stateSlug}/${citySlug}/${profile.slug}`,
          priority: 0.6,
          changefreq: 'weekly',
          lastmod: lastmod
        })
      }
    })

    const profileSitemap = generateSitemapXML(profileUrls)
    fs.writeFileSync(path.join(publicDir, 'sitemap-profiles.xml'), profileSitemap)
    console.log(`✅ Generated sitemap-profiles.xml (${profileUrls.length} URLs - individual profiles)`)
  } else {
    console.log('⚠️  No profiles found, skipping sitemap-profiles.xml')
  }

  // 5. Main sitemap index
  const sitemapFiles = [
    'sitemap-core.xml',
    'sitemap-cities.xml',
    'sitemap-blog.xml'
  ]
  if (profileUrls.length > 0) {
    sitemapFiles.push('sitemap-profiles.xml')
  }

  const sitemapIndex = generateSitemapIndex(sitemapFiles)
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapIndex)
  console.log(`✅ Generated sitemap.xml (index file)`)

  // Summary
  const totalUrls = coreUrls.length + cityUrls.length + blogUrls.length + profileUrls.length
  console.log(`\n📊 Total URLs in sitemap: ${totalUrls}`)
  console.log('   - Core pages:', coreUrls.length)
  console.log('   - Anchor city pages:', cityUrls.length)
  console.log('   - Blog posts:', blogUrls.length)
  console.log('   - Individual profiles:', profileUrls.length)
  console.log('\n🎯 Focused on anchor cities for SEO authority building')
  console.log('🏆 Cities with more profiles get higher sitemap priority')
  console.log('👤 All visible profiles now included in sitemap')
}

main().catch(err => {
  console.error('Error generating sitemap:', err)
  process.exit(1)
})
