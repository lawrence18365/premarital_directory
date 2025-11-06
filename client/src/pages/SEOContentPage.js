import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { SEOHelmet } from '../components/analytics'
import Breadcrumbs from '../components/common/Breadcrumbs'
import ProfileList from '../components/profiles/ProfileList'
import { profileOperations } from '../lib/supabaseClient'

const SEOContentPage = () => {
  const { slug } = useParams()
  const [content, setContent] = useState(null)
  const [relatedProfiles, setRelatedProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadContent()
  }, [slug])

  const loadContent = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load SEO content
      const { data: seoContent, error: contentError } = await supabase
        .from('seo_content')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (contentError) {
        setError('Content not found')
        setLoading(false)
        return
      }

      setContent(seoContent)

      // Load related profiles for the location
      let profiles = []
      if (seoContent.type === 'city') {
        const { data } = await profileOperations.getProfilesByStateAndCity(
          seoContent.state, 
          seoContent.location
        )
        profiles = data || []
      } else if (seoContent.type === 'state') {
        const { data } = await profileOperations.getProfilesByState(seoContent.location)
        profiles = data || []
      }

      setRelatedProfiles(profiles.slice(0, 12)) // Show top 12 profiles

    } catch (err) {
      console.error('Error loading content:', err)
      setError('Failed to load content')
    }

    setLoading(false)
  }

  const formatContent = (title, content) => {
    // Convert markdown-style content to HTML
    let htmlContent = content
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^\*\*(.*?)\*\*$/gm, '<strong>$1</strong>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.*)$/gm, '<p>$1</p>')
      .replace(/<p><h/g, '<h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
      .replace(/<p><ul>/g, '<ul>')
      .replace(/<\/ul><\/p>/g, '</ul>');

    // Ensure there is an H1 tag
    if (!/^<h1>/m.test(htmlContent)) {
      htmlContent = `<h1>${title}</h1>` + htmlContent;
    }

    return htmlContent;
  }

  const generateBreadcrumbs = () => {
    const crumbs = [{ name: 'Home', url: '/' }]

    if (content?.type === 'state') {
      crumbs.push({ 
        name: `${content.location} Premarital Counseling`, 
        url: `/seo/${content.slug}` 
      })
    } else if (content?.type === 'city') {
      crumbs.push({ 
        name: `${content.state} Counseling`, 
        url: `/seo/premarital-counseling-${content.state.toLowerCase().replace(/\s+/g, '-')}` 
      })
      crumbs.push({ 
        name: `${content.location} Premarital Counseling`, 
        url: `/seo/${content.slug}` 
      })
    } else if (content?.type === 'blog') {
      crumbs.push({ name: 'Blog', url: '/blog' })
      crumbs.push({ 
        name: content.title, 
        url: `/seo/${content.slug}` 
      })
    }

    return crumbs
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading content...</p>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="error-container">
        <h1>Content Not Found</h1>
        <p>The requested content could not be found.</p>
        <a href="/" className="btn btn-primary">Return Home</a>
      </div>
    )
  }

  return (
    <div className="seo-content-page">
      <SEOHelmet 
        title={content.title}
        description={content.meta_description}
        keywords={content.keywords?.join(', ')}
        canonical={`/seo/${content.slug}`}
        type="article"
      />

      <div className="container">
        <div style={{ padding: 'var(--space-8) 0' }}>
          {/* Breadcrumbs */}
          <Breadcrumbs crumbs={generateBreadcrumbs()} />

          {/* Main Content */}
          <div className="content-layout">
            <main className="main-content">
              {/* Article Header */}
              <header className="article-header">
                <div className="article-meta">
                  <span className="content-type">{content.type}</span>
                  <span className="location">
                    {content.location}{content.state && `, ${content.state}`}
                  </span>
                  <span className="word-count">
                    {content.word_count} words
                  </span>
                </div>
              </header>

              {/* Article Content */}
              <div 
                className="article-content"
                dangerouslySetInnerHTML={{ __html: formatContent(content.title, content.content) }}
              />

              {/* Call to Action */}
              <div className="content-cta">
                <div className="cta-box">
                  <h3>Ready to Strengthen Your Relationship?</h3>
                  <p>
                    Browse qualified premarital counselors in {content.location}
                    {content.state && `, ${content.state}`} and take the first step 
                    toward your strongest marriage.
                  </p>
                  <div className="cta-actions">
                    {content.type === 'city' ? (
                      <a 
                        href={`/professionals?state=${content.state}&city=${content.location}`}
                        className="btn btn-primary btn-large"
                      >
                        Find Counselors in {content.location}
                      </a>
                    ) : (
                      <a 
                        href={`/professionals?state=${content.location}`}
                        className="btn btn-primary btn-large"
                      >
                        Browse {content.location} Professionals
                      </a>
                    )}
                    <a href="/claim-profile" className="btn btn-outline btn-large">
                      Are You a Professional?
                    </a>
                  </div>
                </div>
              </div>
            </main>

            {/* Sidebar */}
            <aside className="content-sidebar">
              {/* Related Professionals */}
              {relatedProfiles.length > 0 && (
                <div className="sidebar-section">
                  <h3>Professionals in {content.location}</h3>
                  <div className="sidebar-profiles">
                    {relatedProfiles.slice(0, 3).map(profile => (
                      <div key={profile.id} className="sidebar-profile">
                        <div className="profile-header">
                          <h4>{profile.full_name}</h4>
                          <p className="profession">{profile.profession}</p>
                          <p className="location">{profile.city}, {profile.state_province}</p>
                        </div>
                        {profile.specialties && profile.specialties.length > 0 && (
                          <div className="specialties">
                            {profile.specialties.slice(0, 2).map((specialty, index) => (
                              <span key={index} className="specialty-tag">
                                {specialty}
                              </span>
                            ))}
                          </div>
                        )}
                        <a 
                          href={`/profile/${profile.slug || profile.id}`}
                          className="btn btn-small btn-outline"
                        >
                          View Profile
                        </a>
                      </div>
                    ))}
                  </div>
                  <a 
                    href={content.type === 'city' 
                      ? `/professionals?state=${content.state}&city=${content.location}`
                      : `/professionals?state=${content.location}`
                    }
                    className="btn btn-primary btn-full"
                  >
                    View All Professionals
                  </a>
                </div>
              )}

              {/* Quick Actions */}
              <div className="sidebar-section">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <a href="/contact" className="action-item">
                    <i className="fa fa-question-circle"></i>
                    Get Help Choosing
                  </a>
                  <a href="/claim-profile" className="action-item">
                    <i className="fa fa-user-plus"></i>
                    Join Our Directory
                  </a>
                  <a href="/blog" className="action-item">
                    <i className="fa fa-book"></i>
                    Relationship Resources
                  </a>
                </div>
              </div>

              {/* Local Statistics */}
              {(content.type === 'city' || content.type === 'state') && (
                <div className="sidebar-section">
                  <h3>Local Directory Stats</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-number">{relatedProfiles.length}+</div>
                      <div className="stat-label">Verified Professionals</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">
                        {[...new Set(relatedProfiles.map(p => p.profession))].length}
                      </div>
                      <div className="stat-label">Specialties Available</div>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Related Professionals Grid */}
          {relatedProfiles.length > 3 && (
            <section className="related-professionals">
              <h2>Featured Professionals in {content.location}</h2>
              <ProfileList profiles={relatedProfiles} />
              <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
                <a 
                  href={content.type === 'city' 
                    ? `/professionals?state=${content.state}&city=${content.location}`
                    : `/professionals?state=${content.location}`
                  }
                  className="btn btn-primary btn-large"
                >
                  View All {content.location} Professionals
                </a>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default SEOContentPage