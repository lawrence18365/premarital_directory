
import React from 'react'
import { Helmet } from 'react-helmet'

// Enhanced SEO utilities
const generateBreadcrumbStructuredData = (breadcrumbs, siteUrl = 'https://www.weddingcounselors.com') => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url ? `${siteUrl}${crumb.url}` : undefined
    }))
  }
}

const generateFAQStructuredData = (faqs) => {
  if (!faqs || faqs.length === 0) return null

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

const generateOrganizationStructuredData = (siteUrl) => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Wedding Counselors",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "Directory of qualified premarital counselors, therapists, and coaches helping engaged couples prepare for marriage.",
    "sameAs": [
      "https://www.facebook.com/weddingcounselors",
      "https://twitter.com/weddingcounsel"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "support@weddingcounselors.com",
      "availableLanguage": ["English"]
    },
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    "knowsAbout": [
      "Premarital Counseling",
      "Premarital Counselling",
      "Marriage Preparation",
      "Pre-Marriage Therapy",
      "Pre-Marital Counseling",
      "Relationship Counseling",
      "Engaged Couples Counseling"
    ]
  }
}

const generateReviewStructuredData = (reviews, professional) => {
  if (!reviews || reviews.length === 0) return null;

  return reviews.map(review => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "reviewBody": review.reviewBody,
    "itemReviewed": {
      "@type": "Person",
      "name": professional.full_name
    }
  }));
};

const SEOHelmet = ({ 
  title, 
  description, 
  url, 
  type = 'website',
  image = '/assets/images/og-default.webp',
  structuredData = null,
  breadcrumbs = null,
  faqs = null,
  reviews = null,
  professional = null,
  keywords = null,
  author = null,
  publishedTime = null,
  modifiedTime = null,
  noindex = false
}) => {
  // Determine a safe, canonical site URL
  const envSiteUrl = process.env.REACT_APP_SITE_URL
  const defaultSiteUrl = 'https://www.weddingcounselors.com'
  const siteUrl = (envSiteUrl && !/:\/\/click\./i.test(envSiteUrl)) ? envSiteUrl : defaultSiteUrl
  const siteName = process.env.REACT_APP_SITE_NAME || 'Wedding Counselors'
  // Fallback to current location path when no url prop provided (prevents duplicate root canonicals)
  const currentPath = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : ''
  const effectivePath = url || currentPath || '/'
  
  // Normalize URL - remove trailing slashes except for root
  const normalizedPath = effectivePath === '/' ? '/' : effectivePath.replace(/\/+$/, '')
  const fullUrl = `${siteUrl}${normalizedPath}`
  const fullTitle = title ? `${title} | ${siteName}` : siteName
  const defaultDescription = process.env.REACT_APP_SITE_DESCRIPTION || 'Find qualified premarital counselors, therapists, and coaches near you. Complete directory of wedding counseling professionals.'

  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="robots" content={noindex ? "noindex, follow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Keywords */}
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Author */}
      {author && <meta name="author" content={author} />}
      
      {/* Article meta */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={`${siteUrl}${image}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={`${siteUrl}${image}`} />
      {process.env.REACT_APP_TWITTER_URL && (
        <>
          <meta name="twitter:site" content={`@${process.env.REACT_APP_TWITTER_URL.split('/').pop()}`} />
          <meta name="twitter:creator" content={`@${process.env.REACT_APP_TWITTER_URL.split('/').pop()}`} />
        </>
      )}

      {/* Combined Structured Data */}
      <script type="application/ld+json">
        {(() => {
          const allData = [];

          // Always include Organization schema for E-E-A-T
          allData.push(generateOrganizationStructuredData(siteUrl));

          if (structuredData) {
            allData.push(structuredData);
          }
          if (breadcrumbs) {
            allData.push(generateBreadcrumbStructuredData(breadcrumbs, siteUrl));
          }
          if (faqs) {
            allData.push(generateFAQStructuredData(faqs));
          }
          if (reviews && professional) {
            allData.push(...generateReviewStructuredData(reviews, professional));
          }

          if (allData.length === 0) {
            return null;
          }
          if (allData.length === 1) {
            return JSON.stringify(allData[0]);
          }
          return JSON.stringify({
            "@context": "https://schema.org",
            "@graph": allData
          });
        })()}
      </script>
    </Helmet>
  )
}

// Generate enhanced structured data for professional profiles
export const generateProfessionalStructuredData = (professional) => {
  const baseUrl = process.env.REACT_APP_SITE_URL || 'https://www.weddingcounselors.com';

  const professionalData = {
    "@context": "https://schema.org",
    "@type": ["Person", "LocalBusiness"],
    "name": professional.full_name,
    "jobTitle": professional.profession || "Marriage Counselor",
    "description": professional.bio,
    "image": professional.photo_url ? `${baseUrl}${professional.photo_url}` : `${baseUrl}/media/default-therapist.webp`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": professional.city,
      "addressRegion": professional.state_province,
      "postalCode": professional.postal_code,
      "addressCountry": "US"
    },
    "telephone": professional.phone,
    "email": professional.email,
    "url": professional.website,
    "areaServed": {
      "@type": "Place",
      "name": `${professional.city}, ${professional.state_province}`,
      "geo": {
        "@type": "GeoCoordinates",
        "addressCountry": "US"
      }
    },
    "serviceType": professional.specialties || ["Premarital Counseling"],
    "knowsAbout": [
      "Marriage Counseling",
      "Premarital Counseling", 
      "Relationship Therapy",
      "Couples Therapy"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Counseling Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Premarital Counseling",
            "description": "Professional guidance for couples preparing for marriage"
          }
        }
      ]
    },
    "mainEntityOfPage": `${baseUrl}/profile/${professional.id}`,
    "sameAs": [
      professional.website,
      professional.facebook_url,
      professional.linkedin_url,
      professional.instagram_url
    ].filter(Boolean)
  };

  if (professional.reviews && professional.reviews.length > 0) {
    const totalRating = professional.reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = totalRating / professional.reviews.length;

    professionalData.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": averageRating.toFixed(1),
      "reviewCount": professional.reviews.length
    };
  }

  return professionalData;
};

// Generate structured data for city pages
export const generateCityStructuredData = (city, state, professionals) => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Premarital Counselors in ${city}, ${state}`,
    "description": `Find qualified premarital counselors and marriage therapists in ${city}, ${state}`,
    "numberOfItems": professionals.length,
    "itemListElement": professionals.map((professional, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Person",
        "name": professional.full_name,
        "jobTitle": professional.profession || "Marriage Counselor",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": professional.city,
          "addressRegion": professional.state_province
        }
      }
    }))
  }
}

export default SEOHelmet
