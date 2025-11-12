import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../analytics/SEOHelmet'

const Breadcrumbs = ({ items = [], className = '', variant }) => {
  if (!items || items.length === 0) return null

  // Generate breadcrumb structured data for SEO
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url ? `${process.env.REACT_APP_SITE_URL || 'https://www.weddingcounselors.com'}${item.url}` : undefined
    }))
  }

  return (
    <>
      <SEOHelmet structuredData={breadcrumbStructuredData} />
      <nav className={`breadcrumbs ${variant ? `breadcrumbs--${variant}` : ''} ${className}`.trim()} aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          {items.map((item, index) => (
            <li key={index} className="breadcrumb-item">
              {item.url && index < items.length - 1 ? (
                <Link 
                  to={item.url} 
                  className="breadcrumb-link"
                  aria-label={`Navigate to ${item.name}`}
                >
                  {item.name}
                </Link>
              ) : (
                <span className="breadcrumb-current" aria-current="page">
                  {item.name}
                </span>
              )}
              {index < items.length - 1 && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  <i className="fas fa-chevron-right"></i>
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}

// Helper function to generate common breadcrumb patterns
export const generateBreadcrumbs = {
  // Home > States > State Name
  statePage: (stateName) => [
    { name: 'Home', url: '/' },
    { name: 'States', url: '/states' },
    { name: stateName, url: null }
  ],

  // Home > States > State Name > City Name
  cityPage: (stateName, cityName, stateUrl = null) => [
    { name: 'Home', url: '/' },
    { name: 'States', url: '/states' },
    { name: stateName, url: stateUrl },
    { name: cityName, url: null }
  ],

  // Home > States > State Name > Professional Name
  profilePage: (stateName, professionalName, stateUrl = null, profileUrl = null) => [
    { name: 'Home', url: '/' },
    { name: 'States', url: '/states' },
    { name: stateName, url: stateUrl },
    { name: professionalName, url: profileUrl }
  ],

  // Home > Blog
  blogIndex: () => [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: null }
  ],

  // Home > Blog > Post Title
  blogPost: (postTitle) => [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: postTitle, url: null }
  ],

  // Home > About/Contact/etc
  staticPage: (pageName) => [
    { name: 'Home', url: '/' },
    { name: pageName, url: null }
  ],

  // Professional Dashboard breadcrumbs
  professionalDashboard: () => [
    { name: 'Home', url: '/' },
    { name: 'Professional Dashboard', url: null }
  ],

  professionalProfile: () => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/professional/dashboard' },
    { name: 'Edit Profile', url: null }
  ],

  professionalLeads: () => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/professional/dashboard' },
    { name: 'Leads', url: null }
  ]
}

export default Breadcrumbs
