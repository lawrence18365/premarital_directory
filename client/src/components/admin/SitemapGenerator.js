import React, { useState, useEffect } from 'react'
import supabase from '../../lib/supabaseClient'

const SitemapGenerator = () => {
  const [profiles, setProfiles] = useState([])
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, city, state_province, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
      setMessage('Error fetching profiles')
    }
  }

  const generateProfilesSitemap = () => {
    setGenerating(true)
    
    const generateSlug = (name, id) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) + '-' + id.substring(0, 8)
    }

    const generateLocationSlug = (city, state) => {
      const citySlug = city?.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-') || 'unknown'
      const stateSlug = state?.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-') || 'unknown'
      return `${stateSlug}/${citySlug}`
    }

    // Split profiles into chunks of 1000 for multiple sitemap files
    const chunkSize = 1000
    const chunks = []
    for (let i = 0; i < profiles.length; i += chunkSize) {
      chunks.push(profiles.slice(i, i + chunkSize))
    }

    let sitemapFiles = []

    chunks.forEach((chunk, index) => {
      const urls = chunk.map(profile => {
        const slug = generateSlug(profile.full_name, profile.id)
        const locationSlug = generateLocationSlug(profile.city, profile.state_province)
        const lastmod = profile.updated_at || profile.created_at

        return `  <url>
    <loc>https://weddingcounselors.com/professionals/${locationSlug}/${slug}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
      }).join('\n')

      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

      sitemapFiles.push({
        filename: `sitemap-profiles-${index + 1}.xml`,
        content: sitemapContent
      })
    })

    // Generate main profiles sitemap index
    const sitemapIndexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles.map(file => `  <sitemap>
    <loc>https://weddingcounselors.com/${file.filename}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

    // For demo purposes, we'll show the content. In production, this would be saved to files
    console.log('Generated sitemap files:', sitemapFiles.length)
    console.log('First sitemap content preview:', sitemapFiles[0]?.content.substring(0, 500))
    
    setMessage(`Successfully generated ${sitemapFiles.length} sitemap files with ${profiles.length} total profiles`)
    setGenerating(false)

    // Download the main profiles sitemap
    downloadSitemap(sitemapIndexContent, 'sitemap-profiles.xml')
  }

  const downloadSitemap = (content, filename) => {
    const blob = new Blob([content], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="sitemap-generator">
      <div className="admin-header">
        <h1>Sitemap Generator</h1>
        <p>Generate XML sitemaps for all profiles in the directory</p>
      </div>

      <div className="admin-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Profiles</h3>
            <div className="stat-number">{profiles.length}</div>
          </div>
          <div className="stat-card">
            <h3>Sitemap Files</h3>
            <div className="stat-number">{Math.ceil(profiles.length / 1000)}</div>
          </div>
        </div>

        <div className="action-section">
          <button 
            onClick={generateProfilesSitemap}
            disabled={generating || profiles.length === 0}
            className="btn btn-primary"
          >
            {generating ? 'Generating...' : 'Generate Profiles Sitemap'}
          </button>
          
          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>Sitemap Structure</h3>
          <ul>
            <li><strong>Main Sitemap:</strong> https://weddingcounselors.com/sitemap.xml</li>
            <li><strong>Pages:</strong> https://weddingcounselors.com/sitemap-main.xml</li>
            <li><strong>States:</strong> https://weddingcounselors.com/sitemap-states.xml</li>
            <li><strong>Profiles:</strong> https://weddingcounselors.com/sitemap-profiles.xml</li>
            <li><strong>Blog:</strong> https://weddingcounselors.com/sitemap-blog.xml</li>
          </ul>
          
          <h3>SEO Best Practices</h3>
          <ul>
            <li>Profiles are organized by state and city for better local SEO</li>
            <li>Each profile has a unique, SEO-friendly URL slug</li>
            <li>Sitemaps are split into chunks of 1000 URLs for optimal performance</li>
            <li>Change frequencies are optimized for different content types</li>
            <li>Priority scores reflect the importance hierarchy</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SitemapGenerator
