import React, { useState } from 'react'
import { profileOperations } from '../lib/supabaseClient'

const SitemapGenerator = () => {
  const [sitemapXML, setSitemapXML] = useState('')
  const [generating, setGenerating] = useState(false)

  const generateSitemap = async () => {
    setGenerating(true)
    try {
      // Get all profiles from database
      const { data: profiles, error } = await profileOperations.getProfiles()
      
      if (error) {
        console.error('Error fetching profiles:', error)
        return
      }

      // Base URLs
      const baseUrl = window.location.origin
      const currentDate = new Date().toISOString().split('T')[0]
      
      // Core pages
      const corePages = [
        { url: '/', priority: '1.0', changefreq: 'weekly' },
        { url: '/therapists', priority: '0.9', changefreq: 'daily' },
        { url: '/coaches', priority: '0.9', changefreq: 'daily' },
        { url: '/clergy', priority: '0.9', changefreq: 'daily' },
        { url: '/about', priority: '0.6', changefreq: 'monthly' },
        { url: '/contact', priority: '0.6', changefreq: 'monthly' },
        { url: '/pricing', priority: '0.7', changefreq: 'weekly' },
        { url: '/features', priority: '0.7', changefreq: 'weekly' },
        { url: '/support', priority: '0.6', changefreq: 'monthly' },
        { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
        { url: '/terms', priority: '0.5', changefreq: 'yearly' },
        { url: '/claim-profile', priority: '0.8', changefreq: 'weekly' }
      ]

      // Professional profile pages
      const profilePages = profiles.map(profile => ({
        url: `/professionals/${(profile.state_province || '').toLowerCase().replace(/\s+/g, '-')}/${profile.slug || profile.id}`,
        priority: profile.is_sponsored ? '0.9' : '0.8',
        changefreq: 'weekly',
        lastmod: profile.updated_at || profile.created_at
      }))

      // Location-based pages (auto-generated from profiles)
      const locations = [...new Set(profiles.map(p => `${p.city}-${p.state_province}`.toLowerCase().replace(/\s+/g, '-')))]
      const locationPages = []
      
      locations.forEach(location => {
        locationPages.push(
          { url: `/therapists/${location}`, priority: '0.7', changefreq: 'daily' },
          { url: `/coaches/${location}`, priority: '0.7', changefreq: 'daily' },
          { url: `/clergy/${location}`, priority: '0.7', changefreq: 'daily' }
        )
      })

      // Specialty pages (auto-generated from profile specialties)
      const allSpecialties = profiles.flatMap(p => p.specialties || [])
      const uniqueSpecialties = [...new Set(allSpecialties)]
      const specialtyPages = uniqueSpecialties.map(specialty => ({
        url: `/specialists/${specialty.toLowerCase().replace(/\s+/g, '-')}`,
        priority: '0.7',
        changefreq: 'weekly'
      }))

      // Combine all pages
      const allPages = [...corePages, ...profilePages, ...locationPages, ...specialtyPages]

      // Generate XML
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

      setSitemapXML(sitemap)
      
      // Also save to public folder for deployment
      const blob = new Blob([sitemap], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sitemap.xml'
      a.click()
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error generating sitemap:', error)
    }
    setGenerating(false)
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1>Sitemap Generator</h1>
          <p className="lead">
            Generate an SEO sitemap for all professionals and pages in your directory.
          </p>
        </div>

        <div className="content-section">
          <div className="sitemap-controls">
            <button 
              onClick={generateSitemap} 
              disabled={generating}
              className="btn btn-primary"
            >
              {generating ? 'Generating...' : 'Generate Sitemap'}
            </button>
            
            {sitemapXML && (
              <div className="sitemap-stats">
                <p><strong>Generated:</strong> {sitemapXML.split('<url>').length - 1} URLs</p>
                <p><strong>File:</strong> sitemap.xml downloaded</p>
              </div>
            )}
          </div>

          {sitemapXML && (
            <div className="sitemap-preview">
              <h3>Sitemap Preview</h3>
              <textarea 
                value={sitemapXML} 
                readOnly 
                rows={20}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }}
              />
            </div>
          )}

          <div className="sitemap-instructions">
            <h3>Next Steps:</h3>
            <ol>
              <li>Upload the sitemap.xml to your website's root directory</li>
              <li>Submit to Google Search Console: Search Console → Sitemaps → Add sitemap.xml</li>
              <li>Monitor indexing progress in the Coverage report</li>
              <li>Regenerate weekly as you add new professionals</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SitemapGenerator
