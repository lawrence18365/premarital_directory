import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const EditorialStandardsPage = () => {
  return (
    <div className="page-container about-page">
      <SEOHelmet
        title="Editorial Standards | Premarital Counseling Directory"
        description="Our editorial standards for maintaining accurate, up-to-date premarital counseling professional listings. Learn about our moderation, data quality, and enrichment processes."
        url="/editorial-standards"
        canonicalUrl="https://www.weddingcounselors.com/editorial-standards"
      />
      <div className="container">
        <div className="container-narrow">
          <div className="page-header">
            <h1>Editorial Standards</h1>
            <p className="lead">
              How we maintain accurate, trustworthy professional listings
            </p>
          </div>

          <div className="content-section">
            <h2>Data Accuracy</h2>
            <p>
              Accurate information is the foundation of a useful directory. We take the following
              steps to ensure listing quality:
            </p>
            <ul>
              <li>
                <strong>Self-reported data:</strong> Claimed profiles are maintained directly by
                the professional. They have full control over their bio, specialties, pricing,
                insurance, and availability information.
              </li>
              <li>
                <strong>Public data enrichment:</strong> For unclaimed profiles, we periodically
                update information from publicly available sources including licensing board
                records, professional websites, and practice directories.
              </li>
              <li>
                <strong>Structured fields:</strong> We use standardized fields for credentials,
                session types, treatment approaches, and pricing to make it easy for couples to
                compare professionals.
              </li>
            </ul>

            <h2>Moderation Process</h2>
            <p>
              Every profile in our directory is subject to moderation:
            </p>
            <ul>
              <li>
                Profiles are reviewed for completeness, accuracy, and compliance with our{' '}
                <Link to="/guidelines">community guidelines</Link>.
              </li>
              <li>
                Spam, fraudulent, or misleading listings are removed promptly.
              </li>
              <li>
                Profiles reported by users are investigated and corrected or removed as needed.
              </li>
              <li>
                Professionals who violate our guidelines may have their profiles hidden or removed.
              </li>
            </ul>

            <h2>What We Do Not Do</h2>
            <ul>
              <li>We do not sell undisclosed pay-to-play placement inside organic search results.</li>
              <li>We do not fabricate reviews or endorsements.</li>
              <li>We do not guarantee the quality of any professional's services.</li>
              <li>We do not verify specific clinical outcomes or success rates.</li>
            </ul>

            <p>
              We may offer clearly labeled featured placements, sponsorship modules, or profile merchandising tools.
              Those are disclosed as promotional surfaces and do not replace our underlying organic ranking rules.
            </p>

            <h2>Profile Enrichment</h2>
            <p>
              To help couples make informed decisions, we enrich profiles with structured data
              when available:
            </p>
            <ul>
              <li>Treatment approaches and methodologies (Gottman, PREPARE/ENRICH, EFT, etc.)</li>
              <li>Session formats (in-person, online, hybrid)</li>
              <li>Pricing ranges and insurance acceptance</li>
              <li>Faith traditions and specialized populations served</li>
              <li>Credentials and certifications from public licensing records</li>
            </ul>

            <h2>Corrections and Updates</h2>
            <p>
              If you are a professional and your information is incorrect, you can{' '}
              <Link to="/claim-profile">claim your profile</Link> and update it directly. If you
              are a couple who has found inaccurate information, please{' '}
              <Link to="/corrections">submit a correction request</Link>.
            </p>

            <p style={{ marginTop: 'var(--space-8)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Last updated: February 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditorialStandardsPage
