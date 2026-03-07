import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const HowItWorksPage = () => {
  return (
    <div className="page-container about-page">
      <SEOHelmet
        title="How Our Directory Works | Premarital Counseling Directory"
        description="Learn how premarital counseling professionals are listed, verified, and maintained in our directory. Understand claimed vs unclaimed profiles and how to report inaccuracies."
        url="/how-it-works"
        canonicalUrl="https://www.weddingcounselors.com/how-it-works"
      />
      <div className="container">
        <div className="container-narrow">
          <div className="page-header">
            <h1>How Our Directory Works</h1>
            <p className="lead">
              Transparency in how we source, verify, and maintain professional listings
            </p>
          </div>

          <div className="content-section">
            <h2>How Professionals Get Listed</h2>
            <p>
              Our directory includes premarital counseling professionals from two primary sources:
            </p>
            <ul>
              <li>
                <strong>Organic signups:</strong> Licensed therapists, certified coaches, and ordained
                clergy can create a profile directly through our{' '}
                <Link to="/professional/signup">signup process</Link>. After verifying their email
                and completing the onboarding form, their profile goes live immediately.
              </li>
              <li>
                <strong>Public data sources:</strong> We aggregate publicly available information
                about premarital counseling professionals from licensing boards, professional
                directories, and church program listings. These profiles are marked as "unclaimed"
                until the professional verifies ownership.
              </li>
            </ul>

            <h2>Verification Process</h2>
            <p>
              We take several steps to maintain listing quality:
            </p>
            <ul>
              <li>
                <strong>Email verification:</strong> All professionals who sign up must verify their
                email address before their profile is published.
              </li>
              <li>
                <strong>Profile claiming:</strong> Professionals sourced from public data can{' '}
                <Link to="/claim-profile">claim their profile</Link> by verifying their identity.
                Once claimed, they can update their information and respond to inquiries directly.
              </li>
              <li>
                <strong>Ongoing moderation:</strong> Our team reviews profiles for accuracy, removes
                spam or fraudulent listings, and responds to reports from users.
              </li>
            </ul>

            <h2>Claimed vs. Unclaimed Profiles</h2>
            <div className="feature-grid">
              <div>
                <h4>Claimed Profiles</h4>
                <ul>
                  <li>Professional has verified their identity</li>
                  <li>Information is self-reported and up to date</li>
                  <li>Professional can respond to inquiries directly</li>
                  <li>Availability status is actively maintained</li>
                </ul>
              </div>
              <div>
                <h4>Unclaimed Profiles</h4>
                <ul>
                  <li>Based on publicly available information</li>
                  <li>May contain outdated details</li>
                  <li>Inquiries are forwarded when possible</li>
                  <li>Marked with a notice for transparency</li>
                </ul>
              </div>
            </div>

            <h2>How Couples Can Help</h2>
            <p>
              If you find inaccurate information on any listing, please let us know. We rely on
              community feedback to keep our directory accurate and helpful.
            </p>
            <ul>
              <li>
                <Link to="/corrections">Request a correction or removal</Link>
              </li>
              <li>
                <Link to="/contact">Contact us</Link> with any concerns about a listing
              </li>
            </ul>

            <h2>Our Commitment</h2>
            <p>
              We are committed to helping engaged couples find qualified premarital counseling
              professionals. Our directory is free for couples to use. Organic ranking is based on
              listing quality signals like claim status, profile completeness, pricing/session detail,
              and freshness. If we run clearly labeled featured placements or sponsorship modules,
              they are disclosed and do not rewrite those organic criteria. Read our{' '}
              <Link to="/editorial-standards">editorial standards</Link> and{' '}
              <Link to="/guidelines">community guidelines</Link> for more information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowItWorksPage
