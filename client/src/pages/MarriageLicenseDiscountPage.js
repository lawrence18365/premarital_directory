import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import Breadcrumbs from '../components/common/Breadcrumbs'
import FAQ from '../components/common/FAQ'
import LeadContactForm from '../components/leads/LeadContactForm'
import { STATE_DISCOUNT_CONFIG, getStatesWithDiscounts } from '../data/specialtyConfig'
import { STATE_CONFIG } from '../data/locationConfig'
import '../assets/css/discount-page.css'

const MarriageLicenseDiscountPage = () => {
  const [showGetMatchedForm, setShowGetMatchedForm] = useState(false)

  const discountStates = getStatesWithDiscounts()

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Premarital Counseling', url: '/premarital-counseling' },
    { name: 'Marriage License Discounts', url: null }
  ]

  // General FAQs about marriage license discounts
  const faqs = [
    {
      question: 'Which states offer marriage license discounts for premarital counseling?',
      answer: `Several states offer discounts on marriage license fees for couples who complete premarital counseling: Florida ($32.50 off), Texas ($60 off), Minnesota (up to $75 off), Tennessee ($60 off), Oklahoma ($50 off), Georgia ($16-50 off), Maryland ($25 off), and Indiana ($60 off). Some states also waive waiting periods.`
    },
    {
      question: 'How do I get the marriage license discount?',
      answer: 'Complete a qualifying premarital counseling program and receive a certificate of completion. Present this certificate when applying for your marriage license at the county clerk\'s office. Requirements vary by state regarding program length and provider qualifications.'
    },
    {
      question: 'How long does premarital counseling need to be for the discount?',
      answer: 'Requirements vary: Florida requires 4 hours, Texas requires 8 hours (Twogether in Texas program), Minnesota requires 12 hours, and most other states require 4-6 hours. Check your specific state requirements.'
    },
    {
      question: 'Do online premarital counseling programs qualify for the discount?',
      answer: 'It depends on the state. Some states accept online programs while others require in-person sessions with a licensed professional or clergy member. Check your state\'s specific requirements or ask your counselor.'
    },
    {
      question: 'Can any counselor provide the certificate for the discount?',
      answer: 'Most states require the counselor to be licensed (LMFT, LPC, LCSW, psychologist) or ordained clergy. Some states like Texas have specific approved programs. Your counselor should know if they\'re qualified to issue the certificate.'
    },
    {
      question: 'How long is the premarital counseling certificate valid?',
      answer: 'Validity periods vary by state. Texas certificates are valid for 1 year, while other states may have different timeframes. Complete counseling close to your wedding date to ensure the certificate is still valid.'
    }
  ]

  // Structured data
  const pageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Marriage License Discounts for Premarital Counseling",
    "description": "Save money on your marriage license by completing premarital counseling. Learn about state discounts and find qualified counselors.",
    "mainEntity": {
      "@type": "ItemList",
      "name": "States Offering Marriage License Discounts",
      "numberOfItems": discountStates.length,
      "itemListElement": discountStates.map((stateSlug, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "GovernmentService",
          "name": `${STATE_CONFIG[stateSlug]?.name || stateSlug} Marriage License Discount`,
          "description": STATE_DISCOUNT_CONFIG[stateSlug].notes
        }
      }))
    }
  }

  return (
    <>
      <SEOHelmet
        title="Marriage License Discounts for Premarital Counseling | Save $25-$75"
        description="Save money on your marriage license! 8 states offer $25-$75 discounts for couples who complete premarital counseling. Florida, Texas, Minnesota & more. Find qualified counselors."
        url="/premarital-counseling/marriage-license-discount"
        keywords="marriage license discount, premarital counseling discount, save money marriage license, florida marriage license discount, texas marriage license discount, minnesota marriage license discount"
        breadcrumbs={breadcrumbItems}
        structuredData={pageStructuredData}
        faqs={faqs}
        canonicalUrl="https://www.weddingcounselors.com/premarital-counseling/marriage-license-discount"
      />

      <div className="discount-page">
        {/* Hero Section */}
        <div className="discount-hero">
          <div className="discount-container">
            <Breadcrumbs items={breadcrumbItems} variant="on-hero" />

            <div className="discount-hero-content">
              <div className="discount-badge">
                <i className="fa fa-piggy-bank"></i>
                Save $25-$75
              </div>

              <h1 className="discount-title">
                Marriage License Discounts for Premarital Counseling
              </h1>

              <p className="discount-subtitle">
                8 states reward couples who invest in their marriage. Complete premarital counseling
                and save on your marriage license fee — plus some states waive the waiting period.
              </p>

              <div className="discount-cta">
                <button
                  onClick={() => setShowGetMatchedForm(true)}
                  className="btn btn-primary btn-large"
                >
                  <i className="fa fa-heart mr-2"></i>
                  Find a Qualifying Counselor
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* States Grid */}
        <div className="discount-states-section">
          <div className="discount-container">
            <h2 className="section-title">States Offering Marriage License Discounts</h2>
            <p className="section-subtitle">
              Click on your state to see specific requirements and find qualified counselors.
            </p>

            <div className="discount-states-grid">
              {discountStates.map(stateSlug => {
                const discount = STATE_DISCOUNT_CONFIG[stateSlug]
                const stateConfig = STATE_CONFIG[stateSlug]
                const stateName = stateConfig?.name || stateSlug.charAt(0).toUpperCase() + stateSlug.slice(1)

                return (
                  <div key={stateSlug} className="discount-state-card">
                    <div className="discount-state-header">
                      <h3>{stateName}</h3>
                      <span className="discount-amount">Save {discount.discount}</span>
                    </div>

                    <div className="discount-state-details">
                      <div className="discount-detail">
                        <span className="detail-label">Original Fee:</span>
                        <span className="detail-value">{discount.originalFee}</span>
                      </div>
                      <div className="discount-detail">
                        <span className="detail-label">With Counseling:</span>
                        <span className="detail-value highlight">{discount.discountedFee}</span>
                      </div>
                      {discount.waitingPeriod !== 'No waiting period impact' && (
                        <div className="discount-detail bonus">
                          <i className="fa fa-clock"></i>
                          <span>{discount.waitingPeriod}</span>
                        </div>
                      )}
                    </div>

                    <div className="discount-requirements">
                      <h4>Requirements:</h4>
                      <ul>
                        {discount.requirements.map((req, i) => (
                          <li key={i}>
                            <i className="fa fa-check"></i>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {discount.notes && (
                      <p className="discount-note">{discount.notes}</p>
                    )}

                    <div className="discount-state-actions">
                      <Link
                        to={`/premarital-counseling/${stateSlug}`}
                        className="btn btn-primary"
                      >
                        Find Counselors in {stateName}
                      </Link>
                      {discount.certificateUrl && (
                        <a
                          href={discount.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                        >
                          <i className="fa fa-external-link"></i>
                          Official Info
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="discount-how-section">
          <div className="discount-container">
            <h2 className="section-title">How to Get Your Discount</h2>

            <div className="how-steps">
              <div className="how-step">
                <div className="step-number">1</div>
                <h3>Find a Qualified Counselor</h3>
                <p>
                  Search our directory for licensed therapists or clergy in your state.
                  Look for counselors who specifically mention the marriage license discount.
                </p>
              </div>

              <div className="how-step">
                <div className="step-number">2</div>
                <h3>Complete the Program</h3>
                <p>
                  Attend the required number of hours (varies by state).
                  Most programs are 4-12 hours spread across multiple sessions.
                </p>
              </div>

              <div className="how-step">
                <div className="step-number">3</div>
                <h3>Get Your Certificate</h3>
                <p>
                  Your counselor will provide a certificate of completion.
                  Some states have specific forms that must be used.
                </p>
              </div>

              <div className="how-step">
                <div className="step-number">4</div>
                <h3>Apply for Your License</h3>
                <p>
                  Present your certificate at the county clerk's office when
                  applying for your marriage license to receive the discount.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="discount-faq-section">
          <div className="discount-container">
            <FAQ
              faqs={faqs}
              title="Marriage License Discount FAQ"
              description="Common questions about premarital counseling discounts"
              showSearch={false}
              showAside={false}
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="discount-cta-section">
          <div className="discount-container">
            <div className="cta-box">
              <h2>Ready to Save on Your Marriage License?</h2>
              <p>
                Find a qualified premarital counselor in your state. Many counselors
                offer flexible scheduling, online sessions, and package pricing.
              </p>
              <button
                onClick={() => setShowGetMatchedForm(true)}
                className="btn btn-primary btn-large"
              >
                Find a Counselor Near You
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Get Matched Modal */}
      {showGetMatchedForm && (
        <div className="modal-overlay" onClick={() => setShowGetMatchedForm(false)}>
          <div className="modal-content get-matched-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Find a Counselor for Your State</h3>
              <button
                onClick={() => setShowGetMatchedForm(false)}
                className="modal-close"
                aria-label="Close"
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Tell us about your needs and we'll connect you with qualified counselors who can provide the marriage license discount certificate.</p>
              <LeadContactForm
                profileId={null}
                professionalName="Marriage License Discount Counselors"
                isDiscountMatching={true}
                onSuccess={() => {
                  setShowGetMatchedForm(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MarriageLicenseDiscountPage
