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
  { url: '/features', priority: 0.7, changefreq: 'monthly' },
  { url: '/about', priority: 0.6, changefreq: 'monthly' },
  { url: '/contact', priority: 0.6, changefreq: 'monthly' },
  { url: '/support', priority: 0.6, changefreq: 'monthly' },
  { url: '/guidelines', priority: 0.5, changefreq: 'monthly' },
  { url: '/for-churches', priority: 0.7, changefreq: 'monthly' },
  { url: '/how-it-works', priority: 0.6, changefreq: 'monthly' },
  { url: '/editorial-standards', priority: 0.5, changefreq: 'monthly' },
  { url: '/corrections', priority: 0.5, changefreq: 'monthly' },
  { url: '/privacy', priority: 0.5, changefreq: 'monthly' },
  { url: '/terms', priority: 0.5, changefreq: 'monthly' },
  { url: '/pricing', priority: 0.7, changefreq: 'monthly' },
  // Money keyword specialty pages (high priority)
  { url: '/premarital-counseling/marriage-license-discount', priority: 0.9, changefreq: 'monthly' },
  { url: '/premarital-counseling/marriage-license-discount/florida', priority: 0.85, changefreq: 'monthly' },
  { url: '/premarital-counseling/marriage-license-discount/texas', priority: 0.85, changefreq: 'monthly' },
  { url: '/premarital-counseling/marriage-license-discount/minnesota', priority: 0.85, changefreq: 'monthly' },
  { url: '/premarital-counseling/marriage-license-discount/tennessee', priority: 0.85, changefreq: 'monthly' },
  { url: '/premarital-counseling/marriage-license-discount/oklahoma', priority: 0.85, changefreq: 'monthly' },
  { url: '/premarital-counseling/marriage-license-discount/georgia', priority: 0.85, changefreq: 'monthly' },
  { url: '/premarital-counseling/marriage-license-discount/maryland', priority: 0.85, changefreq: 'monthly' },
  { url: '/premarital-counseling/marriage-license-discount/indiana', priority: 0.85, changefreq: 'monthly' },
  { url: '/premarital-counseling/christian', priority: 0.85, changefreq: 'weekly' },
  { url: '/premarital-counseling/catholic', priority: 0.85, changefreq: 'weekly' },
  { url: '/premarital-counseling/lgbtq', priority: 0.85, changefreq: 'weekly' },
  { url: '/premarital-counseling/online', priority: 0.85, changefreq: 'weekly' },
  { url: '/premarital-counseling/gottman', priority: 0.85, changefreq: 'weekly' },
  { url: '/premarital-counseling/prepare-enrich', priority: 0.85, changefreq: 'weekly' },
  { url: '/premarital-counseling/interfaith', priority: 0.8, changefreq: 'weekly' },
  { url: '/premarital-counseling/second-marriages', priority: 0.8, changefreq: 'weekly' },
  { url: '/premarital-counseling/military', priority: 0.8, changefreq: 'weekly' },
  { url: '/premarital-counseling/affordable', priority: 0.85, changefreq: 'weekly' }
]

// Fallback blog posts — used only if Supabase fetch fails.
// The script will try to fetch published posts from the DB first.
const BLOG_POSTS_FALLBACK = [
  { slug: 'financial-questions-to-ask-before-marriage', priority: 0.8 },
  { slug: 'fighting-about-wedding-planning', priority: 0.8 },
  { slug: 'setting-healthy-boundaries-with-inlaws', priority: 0.8 },
  { slug: '5-common-myths-about-premarital-counseling-debunked', priority: 0.8 },
  { slug: 'premarital-counseling-cost', priority: 0.9 },
  { slug: 'prepare-enrich-explained', priority: 0.9 },
  { slug: 'how-to-choose-premarital-counselor', priority: 0.9 },
  { slug: 'symbis-explained', priority: 0.9 },
  { slug: 'foccus-explained', priority: 0.9 },
  { slug: 'what-to-expect-premarital-counseling', priority: 0.9 },
  { slug: 'twogether-in-texas', priority: 0.8 },
  { slug: 'how-long-does-premarital-counseling-take', priority: 0.8 },
  { slug: 'online-vs-in-person-premarital-counseling', priority: 0.8 },
  { slug: 'is-premarital-counseling-worth-it', priority: 0.8 },
  { slug: 'what-to-expect-first-premarital-counseling-session', priority: 0.8 },
  { slug: 'premarital-counseling-second-marriages', priority: 0.8 },
  { slug: 'oklahoma-marriage-license-discount', priority: 0.8 },
  { slug: 'indiana-marriage-license-discount', priority: 0.8 },
  { slug: 'christian-vs-secular-premarital-counseling', priority: 0.8 },
  { slug: 'how-to-find-gottman-certified-therapist', priority: 0.8 },
  { slug: 'catholic-marriage-counseling', priority: 0.8 },
  { slug: 'how-to-find-a-marriage-counselor', priority: 0.8 },
  { slug: 'premarital-counseling-with-pastor', priority: 0.8 },
  { slug: 'premarital-counseling-questions-pastor', priority: 0.8 },
  { slug: 'church-premarital-counseling-by-denomination', priority: 0.8 },
  { slug: 'premarital-counseling-exercises-at-home', priority: 0.8 },
  { slug: 'best-premarital-counseling-books', priority: 0.8 },
  { slug: 'florida-marriage-license-discount', priority: 0.8 },
  { slug: 'minnesota-marriage-license-discount', priority: 0.8 },
  { slug: 'georgia-marriage-license-discount', priority: 0.8 },
  { slug: 'pastors-guide-premarital-counseling-program', priority: 0.8 },
  { slug: 'register-premarital-course-provider', priority: 0.8 },
  { slug: 'premarital-counseling-curriculum-comparison', priority: 0.8 },
  { slug: 'prepare-enrich-vs-gottman-vs-symbis', priority: 0.8 },
  { slug: 'premarital-counseling-license-requirements', priority: 0.8 },
  { slug: 'what-divorced-couples-wish-discussed-before-marriage', priority: 0.8 },
  { slug: 'premarital-counseling-statistics', priority: 0.8 },
  { slug: 'premarital-counseling-phoenix', priority: 0.7 },
  { slug: 'premarital-counseling-raleigh-nc', priority: 0.7 },
  { slug: 'premarital-counseling-nashville', priority: 0.7 },
  { slug: 'premarital-counseling-detroit', priority: 0.7 },
  { slug: 'premarital-counseling-chicago', priority: 0.7 },
  { slug: 'premarital-counseling-texas', priority: 0.7 },
  { slug: 'premarital-counseling-new-york', priority: 0.7 },
  { slug: 'premarital-counseling-minnesota', priority: 0.7 },
  { slug: 'premarital-counseling-florida', priority: 0.7 },
  { slug: 'premarital-counseling-illinois', priority: 0.7 }
]

async function fetchBlogPosts() {
  if (!createClient) return null

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase
      .from('posts')
      .select('slug, updated_at, date')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error || !data) return null
    return data.map(p => ({
      slug: p.slug,
      priority: 0.8,
      lastmod: p.updated_at || p.date || null
    }))
  } catch {
    return null
  }
}

// Specialty slugs from specialtyConfig.js
const SPECIALTY_SLUGS = [
  'christian',
  'catholic',
  'lgbtq',
  'online',
  'gottman',
  'prepare-enrich',
  'interfaith',
  'second-marriages',
  'military',
  'affordable'
]

const SPECIALTY_MATCH_TERMS = {
  christian: ['christian', 'faith-based', 'biblical', 'pastor', 'clergy', 'ministry'],
  catholic: ['catholic', 'pre-cana', 'foccus', 'sacrament', 'parish'],
  lgbtq: ['lgbtq', 'lgbtq+', 'gay', 'lesbian', 'queer', 'affirming', 'same-sex'],
  online: ['online', 'virtual', 'telehealth', 'video', 'remote'],
  gottman: ['gottman', 'sound relationship house', 'evidence-based', 'research-based'],
  'prepare-enrich': ['prepare/enrich', 'prepare-enrich', 'prepare enrich', 'premarital assessment', 'inventory'],
  interfaith: ['interfaith', 'multi-faith', 'mixed religion', 'interreligious'],
  'second-marriages': ['second marriage', 'remarriage', 'blended family', 'divorced', 'widowed'],
  military: ['military', 'veteran', 'armed forces', 'army', 'navy', 'air force', 'marines'],
  affordable: ['affordable', 'low cost', 'sliding scale', 'budget', 'reduced fee']
}

const MIN_SPECIALTY_STATE_PROFILES = 3
const MIN_SPECIALTY_CITY_PROFILES = 2
const MIN_SPECIALTY_ANCHOR_CITY_PROFILES = 1
const MIN_VERIFIED_CATHOLIC_PROGRAMS = 3

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
      .select('id, slug, city, state_province, full_name, bio, specialties, onboarding_last_saved_at, created_at, is_hidden')
      .eq('is_hidden', false)
      .or('moderation_status.eq.approved,moderation_status.is.null')
      .order('created_at', { ascending: false })

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

async function fetchCatholicProgramCounts() {
  if (!createClient) {
    console.log('⚠️  Supabase client not available for Catholic program counts')
    return { stateCounts: {}, cityCounts: {}, totalPrograms: 0, hasCoverage: false }
  }

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('⚠️  Supabase credentials not found for Catholic program counts')
    return { stateCounts: {}, cityCounts: {}, totalPrograms: 0, hasCoverage: false }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: programs, error } = await supabase
      .from('program_directory_public')
      .select('id, city, state_province, tradition')
      .eq('tradition', 'Catholic')

    if (error) {
      console.log('⚠️  Error fetching Catholic program counts:', error.message)
      return { stateCounts: {}, cityCounts: {}, totalPrograms: 0, hasCoverage: false }
    }

    const stateCounts = {}
    const cityCounts = {}
      ; (programs || []).forEach((program) => {
        if (!program?.state_province || !program?.city) return
        const stateSlug = getStateSlug(program.state_province)
        const citySlug = getCitySlug(program.city)
        const stateKey = `${stateSlug}`
        const cityKey = `${stateSlug}|${citySlug}`
        stateCounts[stateKey] = (stateCounts[stateKey] || 0) + 1
        cityCounts[cityKey] = (cityCounts[cityKey] || 0) + 1
      })

    return {
      stateCounts,
      cityCounts,
      totalPrograms: (programs || []).length,
      hasCoverage: true
    }
  } catch (err) {
    console.log('⚠️  Failed to fetch Catholic program counts:', err.message)
    return { stateCounts: {}, cityCounts: {}, totalPrograms: 0, hasCoverage: false }
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

function getProfileSearchText(profile) {
  const bio = typeof profile.bio === 'string' ? profile.bio : ''
  const specialties = Array.isArray(profile.specialties)
    ? profile.specialties.join(' ')
    : (typeof profile.specialties === 'string' ? profile.specialties : '')
  return `${bio} ${specialties}`.toLowerCase()
}

function profileMatchesSpecialty(profile, specialtySlug) {
  const terms = SPECIALTY_MATCH_TERMS[specialtySlug] || [specialtySlug]
  const profileText = getProfileSearchText(profile)
  return terms.some(term => profileText.includes(term.toLowerCase()))
}

function buildSpecialtyDepth(profiles) {
  const stateCounts = {}
  const cityCounts = {}

  if (!profiles || profiles.length === 0) {
    return { stateCounts, cityCounts }
  }

  profiles.forEach(profile => {
    if (!profile.city || !profile.state_province) return

    const stateSlug = getStateSlug(profile.state_province)
    const citySlug = getCitySlug(profile.city)

    SPECIALTY_SLUGS.forEach(specialty => {
      if (!profileMatchesSpecialty(profile, specialty)) return

      const stateKey = `${specialty}|${stateSlug}`
      const cityKey = `${specialty}|${stateSlug}|${citySlug}`
      stateCounts[stateKey] = (stateCounts[stateKey] || 0) + 1
      cityCounts[cityKey] = (cityCounts[cityKey] || 0) + 1
    })
  })

  return { stateCounts, cityCounts }
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public')
  const today = new Date().toISOString().split('T')[0]

  console.log('🗺️  Generating comprehensive sitemaps...')

  // Fetch profile counts and profiles from Supabase
  const { cityCounts: profileCounts, profiles: allProfiles } = await fetchProfileCounts()
  const {
    stateCounts: catholicProgramStateCounts,
    cityCounts: catholicProgramCityCounts,
    totalPrograms: totalCatholicPrograms,
    hasCoverage: hasCatholicProgramCoverage
  } = await fetchCatholicProgramCounts()
  const { stateCounts: specialtyStateCounts, cityCounts: specialtyCityCounts } = buildSpecialtyDepth(allProfiles)
  const hasSpecialtyDepthData = Array.isArray(allProfiles) && allProfiles.length > 0

  // 1. Core pages sitemap
  const corePages = CORE_PAGES.filter((page) => {
    if (page.url !== '/premarital-counseling/catholic') return true
    if (!hasCatholicProgramCoverage) return false
    return totalCatholicPrograms >= MIN_VERIFIED_CATHOLIC_PROGRAMS
  })

  const coreUrls = corePages.map(page => ({
    ...page,
    lastmod: today
  }))

  const coreSitemap = generateSitemapXML(coreUrls)
  fs.writeFileSync(path.join(publicDir, 'sitemap-core.xml'), coreSitemap)
  console.log(`✅ Generated sitemap-core.xml (${coreUrls.length} URLs)`)

  // 2. All Cities Sitemap (quality-gated to avoid thin state/city URLs)
  const cityUrls = []
  const hasProfileCoverage = !!profileCounts
  const stateProfileCounts = {}
  if (Array.isArray(allProfiles)) {
    allProfiles.forEach((profile) => {
      if (!profile?.state_province) return
      const stateSlug = getStateSlug(profile.state_province)
      stateProfileCounts[stateSlug] = (stateProfileCounts[stateSlug] || 0) + 1
    })
  }

  // Flatten all cities from STATE_CONFIG
  const allCities = []
  let includedStatePages = 0
  let skippedStatePages = 0
  Object.keys(STATE_CONFIG).forEach(stateSlug => {
    const stateData = STATE_CONFIG[stateSlug]
    const hasStateProfiles = (stateProfileCounts[stateSlug] || 0) > 0

    // Fail closed: never include state URLs when coverage is unavailable.
    // This prevents indexing thin pages if Supabase data is missing at build time.
    if (!hasProfileCoverage) {
      skippedStatePages++
    } else if (hasStateProfiles) {
      cityUrls.push({
        url: `/premarital-counseling/${stateSlug}`,
        priority: 0.8,
        changefreq: 'weekly',
        lastmod: today
      })
      includedStatePages++
    } else {
      skippedStatePages++
    }

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
    // Fail closed when coverage is unavailable
    if (!hasProfileCoverage) return

    const key = `${city.cityName.toLowerCase()}|${city.stateSlug}`
    const profileCount = profileCounts ? (profileCounts[key] || 0) : 0

    // Check if it's an anchor city in CITY_CONFIG
    const isAnchor = CITY_CONFIG[city.stateSlug]?.[city.citySlug]?.is_anchor === true
    // Match CityPage noindex logic: exclude non-anchor cities with <3 profiles
    // CityPage.js:808: shouldNoindex = profiles.length === 0 || (!isAnchor && profiles.length < 3)
    const wouldBeNoindex = profileCount === 0 || (!isAnchor && profileCount < 3)
    if (wouldBeNoindex) return

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
  console.log(`\n✅ Generated sitemap-cities.xml (${cityUrls.length} URLs)`)
  if (hasProfileCoverage) {
    console.log(`   - Included state pages with active profiles: ${includedStatePages}`)
    console.log(`   - Skipped thin state pages: ${skippedStatePages}`)
    console.log('   - Included city pages with active profiles only')
  } else {
    console.log(`   - Coverage data unavailable: skipped all ${skippedStatePages} state pages`)
    console.log('   - Coverage data unavailable: skipped all city pages')
  }

  // 2.5 Programmatic Specialty Sitemap (quality-gated to avoid thin URL bloat)
  const specialtyUrls = []
  let includedSpecialtyStatePages = 0
  let includedSpecialtyCityPages = 0

  if (!hasSpecialtyDepthData) {
    console.log('⚠️  Specialty depth data unavailable; skipping non-Catholic specialty sitemap to avoid noindex mismatches')
  }

  // For each specialty
  SPECIALTY_SLUGS.forEach(specialty => {
    // Iterate all states
    Object.keys(STATE_CONFIG).forEach(stateSlug => {
      const stateKey = `${specialty}|${stateSlug}`
      const specialtyProfilesInState = specialtyStateCounts[stateKey] || 0
      const catholicProgramsInState = catholicProgramStateCounts[stateSlug] || 0
      const stateData = STATE_CONFIG[stateSlug]
      const stateHasAnchorCity = stateData.major_cities.some((cityName) => {
        const citySlug = getCitySlug(cityName)
        return CITY_CONFIG[stateSlug]?.[citySlug]?.is_anchor === true
      })
      // Match SpecialtyStatePage noindex: catholic checks programs, others need >= 3 profiles
      const includeStatePage = specialty === 'catholic'
        ? (
          hasCatholicProgramCoverage &&
          catholicProgramsInState >= MIN_VERIFIED_CATHOLIC_PROGRAMS
        )
        : (
          hasSpecialtyDepthData
            ? specialtyProfilesInState >= MIN_SPECIALTY_STATE_PROFILES
            : false  // Don't guess — skip if we can't verify profile count
        )

      if (includeStatePage) {
        specialtyUrls.push({
          url: `/premarital-counseling/${specialty}/${stateSlug}`,
          priority: 0.8,
          changefreq: 'weekly',
          lastmod: today
        })
        includedSpecialtyStatePages++
      }

      stateData.major_cities.forEach(cityName => {
        const citySlug = getCitySlug(cityName)
        const cityKey = `${specialty}|${stateSlug}|${citySlug}`
        const specialtyProfilesInCity = specialtyCityCounts[cityKey] || 0
        const catholicProgramsInCity = catholicProgramCityCounts[`${stateSlug}|${citySlug}`] || 0
        const isAnchorCity = CITY_CONFIG[stateSlug]?.[citySlug]?.is_anchor === true
        // Match SpecialtyCityPage noindex: catholic checks programs, others need >= 2 (or >= 1 for anchor)
        const includeCityPage = specialty === 'catholic'
          ? (
            hasCatholicProgramCoverage &&
            catholicProgramsInCity >= MIN_VERIFIED_CATHOLIC_PROGRAMS
          )
          : (
            hasSpecialtyDepthData
              ? (
                specialtyProfilesInCity >= MIN_SPECIALTY_CITY_PROFILES ||
                (isAnchorCity && specialtyProfilesInCity >= MIN_SPECIALTY_ANCHOR_CITY_PROFILES)
              )
              : false  // Don't guess — skip if we can't verify profile count
          )

        if (!includeCityPage) return

        specialtyUrls.push({
          url: `/premarital-counseling/${specialty}/${stateSlug}/${citySlug}`,
          priority: specialtyProfilesInCity >= MIN_SPECIALTY_CITY_PROFILES ? 0.7 : 0.6,
          changefreq: 'weekly',
          lastmod: today
        })
        includedSpecialtyCityPages++
      })
    })
  })

  const specialtySitemap = generateSitemapXML(specialtyUrls)
  fs.writeFileSync(path.join(publicDir, 'sitemap-specialties.xml'), specialtySitemap)
  console.log(`✅ Generated sitemap-specialties.xml (${specialtyUrls.length} URLs - quality-gated Programmatic SEO)`)
  console.log(`   - Specialty state pages kept: ${includedSpecialtyStatePages}`)
  console.log(`   - Specialty city pages kept: ${includedSpecialtyCityPages}`)

  // 3. Blog posts sitemap (fetch from DB, fall back to hardcoded list)
  const dbBlogPosts = await fetchBlogPosts()
  const BLOG_POSTS = dbBlogPosts || BLOG_POSTS_FALLBACK
  if (dbBlogPosts) {
    console.log(`   Fetched ${dbBlogPosts.length} blog posts from database`)
  } else {
    console.log(`   ⚠️  Using fallback blog list (${BLOG_POSTS_FALLBACK.length} posts)`)
  }
  const blogUrls = BLOG_POSTS.map(post => ({
    url: `/blog/${post.slug}`,
    priority: post.priority,
    changefreq: 'monthly',
    lastmod: post.lastmod ? new Date(post.lastmod).toISOString().split('T')[0] : today
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
        const lastmod = profile.onboarding_last_saved_at
          ? new Date(profile.onboarding_last_saved_at).toISOString().split('T')[0]
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
    'sitemap-specialties.xml',
    'sitemap-blog.xml'
  ]
  if (profileUrls.length > 0) {
    sitemapFiles.push('sitemap-profiles.xml')
  }

  const sitemapIndex = generateSitemapIndex(sitemapFiles)
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapIndex)
  console.log(`✅ Generated sitemap.xml (index file)`)

  // Summary
  const totalUrls = coreUrls.length + cityUrls.length + specialtyUrls.length + blogUrls.length + profileUrls.length
  console.log(`\n📊 Total URLs in sitemap: ${totalUrls}`)
  console.log('   - Core pages:', coreUrls.length)
  console.log('   - City pages:', cityUrls.length)
  console.log('   - Specialty pages:', specialtyUrls.length)
  console.log('   - Blog posts:', blogUrls.length)
  console.log('   - Individual profiles:', profileUrls.length)
  console.log('\n🎯 Focused on higher-signal pages to reduce thin-index coverage')
  console.log('🏆 Cities with more profiles get higher sitemap priority')
  console.log('👤 All visible profiles now included in sitemap')
}

main().catch(err => {
  console.error('Error generating sitemap:', err)
  process.exit(1)
})
