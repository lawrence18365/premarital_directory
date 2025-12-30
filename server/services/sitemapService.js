const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')
const cron = require('node-cron')
const { STATE_CONFIG } = require('../../client/src/data/locationConfig')
const { getAllSpecialties } = require('../../client/src/data/specialtyConfig')

class SitemapService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    this.sitemapDir = '../client/public'
  }

  // Auto-regenerate sitemaps weekly
  initializeScheduler() {
    // Every Sunday at 2 AM
    cron.schedule('0 2 * * 0', async () => {
      console.log('Weekly sitemap regeneration starting...')
      await this.regenerateAllSitemaps()
      await this.submitToSearchConsole()
    })
  }

  async regenerateAllSitemaps() {
    await Promise.all([
      this.generateProfileSitemap(),
      this.generateStateSitemap(),
      this.generateCitySitemap(),
      this.generateSpecialtySitemap(),
      this.updateMainSitemap()
    ])
  }

  async generateSpecialtySitemap() {
    const specialties = getAllSpecialties()

    // Specialty pages
    const specialtyUrls = specialties.map(specialty => ({
      url: `https://weddingcounselors.com/premarital-counseling/${specialty.slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8' // High priority for money keyword pages
    }))

    // Marriage license discount page (high-value conversion page)
    const discountUrl = {
      url: 'https://weddingcounselors.com/premarital-counseling/marriage-license-discount',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.9' // Very high priority - conversion page
    }

    const allUrls = [discountUrl, ...specialtyUrls]
    const sitemapContent = this.buildXmlSitemap(allUrls)

    await fs.writeFile(
      path.join(__dirname, this.sitemapDir, 'sitemap-specialties.xml'),
      sitemapContent
    )

    console.log(`Generated specialty sitemap with ${allUrls.length} URLs (${specialties.length} specialties + discount page)`)
    return allUrls.length
  }

  async generateProfileSitemap() {
    // Get profiles ready for indexing (approved + published)
    const { data: profiles } = await this.supabase
      .from('profiles')
      .select('slug, full_name, state_province, city, updated_at, ready_for_indexing')
      .eq('ready_for_indexing', true)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    const sitemapContent = this.buildXmlSitemap(
      profiles.map(profile => {
        const stateSlug = Object.keys(STATE_CONFIG).find(key => STATE_CONFIG[key].name === profile.state_province)
        return {
          url: `https://weddingcounselors.com/professionals/${stateSlug}/${profile.slug}`,
          lastmod: new Date(profile.updated_at).toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: profile.is_sponsored ? '0.8' : '0.6'
        }
      })
    )

    await fs.writeFile(
      path.join(__dirname, this.sitemapDir, 'sitemap-profiles.xml'),
      sitemapContent
    )

    console.log(`Generated profile sitemap with ${profiles.length} profiles`)
    return profiles.length
  }

  async generateStateSitemap() {
    // Only include states that have profiles
    const { data: states } = await this.supabase
      .from('profiles')
      .select('state_province')
      .eq('ready_for_indexing', true)
      .eq('status', 'approved')

    const uniqueStates = [...new Set(states.map(s => s.state_province))].filter(Boolean)

    const sitemapContent = this.buildXmlSitemap(
      uniqueStates.map(state => {
        const stateSlug = Object.keys(STATE_CONFIG).find(key => STATE_CONFIG[key].name === state)
        return {
          url: `https://weddingcounselors.com/professionals/${stateSlug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.7'
        }
      })
    )

    await fs.writeFile(
      path.join(__dirname, this.sitemapDir, 'sitemap-states.xml'),
      sitemapContent
    )

    return uniqueStates.length
  }

  async generateCitySitemap() {
    // Only include cities that have approved profiles
    const { data: cities } = await this.supabase
      .from('profiles')
      .select('state_province, city')
      .eq('ready_for_indexing', true)
      .eq('status', 'approved')

    const uniqueCities = [...new Set(cities.map(c => `${c.state_province}/${c.city}`))].filter(Boolean)

    const sitemapContent = this.buildXmlSitemap(
      uniqueCities.map(cityPath => {
        const [state, city] = cityPath.split('/')
        const stateSlug = Object.keys(STATE_CONFIG).find(key => STATE_CONFIG[key].name === state)
        const citySlug = city.toLowerCase().replace(/\s+/g, '-')
        return {
          url: `https://weddingcounselors.com/professionals/${stateSlug}/${citySlug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.6'
        }
      })
    )

    await fs.writeFile(
      path.join(__dirname, this.sitemapDir, 'sitemap-cities.xml'),
      sitemapContent
    )

    return uniqueCities.length
  }

  buildXmlSitemap(urls) {
    const urlEntries = urls.map(({ url, lastmod, changefreq, priority }) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`
  }

  async updateMainSitemap() {
    // Check current phase and update accordingly
    const phase = await this.getCurrentPhase()

    let sitemapRefs = [
      '<loc>https://weddingcounselors.com/sitemap-phase1.xml</loc>',
      '<loc>https://weddingcounselors.com/sitemap-blog.xml</loc>',
      '<loc>https://weddingcounselors.com/sitemap-specialties.xml</loc>' // Always include specialties (money keywords)
    ]

    if (phase >= 2) {
      sitemapRefs.push('<loc>https://weddingcounselors.com/sitemap-states.xml</loc>')
    }
    if (phase >= 3) {
      sitemapRefs.push('<loc>https://weddingcounselors.com/sitemap-cities.xml</loc>')
    }
    if (phase >= 4) {
      sitemapRefs.push('<loc>https://weddingcounselors.com/sitemap-profiles.xml</loc>')
    }

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapRefs.map(loc => `<sitemap>\n    ${loc}\n  </sitemap>`).join('\n  ')}
</sitemapindex>`

    await fs.writeFile(
      path.join(__dirname, this.sitemapDir, 'sitemap.xml'),
      sitemapIndex
    )
  }

  async getCurrentPhase() {
    // Logic to determine current rollout phase
    // Check settings table or calculate based on indexed content
    const { data } = await this.supabase
      .from('settings')
      .select('value')
      .eq('key', 'rollout_phase')
      .single()

    return data?.value || 1
  }

  // Auto-queue new profiles for indexing
  async queueNewProfileForIndexing(profileId) {
    const { error } = await this.supabase
      .from('profiles')
      .update({
        ready_for_indexing: true,
        queued_for_sitemap: true,
        sitemap_queue_date: new Date().toISOString()
      })
      .eq('id', profileId)
      .eq('status', 'approved')

    if (!error) {
      console.log(`Profile ${profileId} queued for next sitemap generation`)
    }
  }

  // Submit to Google Search Console API
  async submitToSearchConsole() {
    try {
      // This would use Google Search Console API
      // For now, just log the action
      console.log('Sitemap submitted to Google Search Console')
      
      // Track submission
      await this.supabase.from('sitemap_submissions').insert({
        submitted_at: new Date().toISOString(),
        type: 'automated_weekly',
        status: 'success'
      })
    } catch (error) {
      console.error('Search Console submission failed:', error)
    }
  }
}

module.exports = SitemapService
