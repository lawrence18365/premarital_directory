import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import FAQ from '../components/common/FAQ'
import {
  FOUNDING_PACKAGES,
  FOUNDING_PAGE_PATH,
  UPGRADE_OFFER,
  buildFoundingInquiryPath
} from '../lib/providerOffers'
import '../assets/css/features.css'

const pricingFAQs = [
  {
    question: 'Is the free listing really free?',
    answer: 'Yes. Community listings are free, and couples can still contact you directly from your profile.'
  },
  {
    question: 'Are paid plans monthly?',
    answer: 'Not right now. The active provider offer is a one-time founding listing. Claimed providers can use self-serve checkout from their dashboard; larger placements are reviewed manually.'
  },
  {
    question: 'What do founding packages include?',
    answer: 'Founding packages focus on profile cleanup, better positioning, and approved featured placement in a target city or specialty.'
  },
  {
    question: 'Can I start free and upgrade later?',
    answer: 'Yes. You can create or claim a free profile first, then apply for a founding package when you want more support or visibility.'
  }
]

const PricingPage = () => {
  const tiers = [
    {
      name: 'Community',
      price: 'Free',
      pricePeriod: 'forever',
      description: 'Get listed, claim your profile, and let couples contact you directly.',
      features: [
        'Basic listing on city and specialty pages',
        'Direct couple inquiries to your email',
        'Profile ownership and editing tools',
        'Basic analytics dashboard'
      ],
      cta: 'Create Free Profile',
      ctaLink: '/professional/signup',
      highlighted: false
    },
    ...FOUNDING_PACKAGES.map((pkg) => ({
      name: pkg.name,
      price: pkg.price,
      pricePeriod: pkg.priceSuffix,
      description: pkg.summary,
      features: pkg.features,
      cta: pkg.id === 'founding-listing' && UPGRADE_OFFER.checkoutUrl
        ? 'Upgrade from Dashboard'
        : pkg.cta,
      ctaLink: pkg.id === 'founding-listing' && UPGRADE_OFFER.checkoutUrl
        ? '/professional/dashboard'
        : buildFoundingInquiryPath(pkg),
      highlighted: pkg.highlight
    }))
  ]

  return (
    <div className="page-container features-page pricing-page">
      <SEOHelmet
        title="Pricing for Premarital Counselors"
        description="Create a free provider profile or apply for one-time founding visibility packages on WeddingCounselors.com."
        url="/pricing"
        noindex={false}
        keywords="premarital counselor pricing, therapist directory pricing, featured counselor listing, founding provider package"
      />

      <div className="container">
        <div className="page-header">
          <h1>Clear pricing for providers</h1>
          <p className="lead">
            Start with a free community profile or apply for a one-time founding package if you want hands-on placement and profile support.
          </p>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 760, margin: 'var(--space-4) auto 0' }}>
            {UPGRADE_OFFER.checkoutUrl
              ? `Claimed providers can upgrade from their dashboard to ${UPGRADE_OFFER.label} at ${UPGRADE_OFFER.price} ${UPGRADE_OFFER.billingNote}. Monthly billing is not live yet.`
              : 'Self-serve monthly billing is not live yet. Paid placements are approved manually so city and specialty inventory stays limited and relevant.'}
          </p>
        </div>

        <div className="content-section">
          <div className="pricing-grid">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`pricing-card ${tier.highlighted ? 'pricing-card--highlighted' : ''}`}
              >
                {tier.highlighted && (
                  <div className="pricing-badge">Best First Paid Offer</div>
                )}

                <div className="pricing-card__header">
                  <h2 className="pricing-card__name">{tier.name}</h2>
                  <div className="pricing-card__price">
                    <span className="pricing-card__amount">{tier.price}</span>
                    <span className="pricing-card__period">{tier.pricePeriod}</span>
                  </div>
                  <p className="pricing-card__description">{tier.description}</p>
                </div>

                <div className="pricing-card__features">
                  <ul>
                    {tier.features.map((feature, index) => (
                      <li key={index}>
                        <i className="fas fa-check" aria-hidden="true"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pricing-card__cta">
                  <Link
                    to={tier.ctaLink}
                    className={`btn ${tier.highlighted ? 'btn-primary' : 'btn-outline'} btn-block`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pricing-callout">
            <div>
              <h2>Need the full founder offer before you apply?</h2>
              <p>
                Review the package details, fit criteria, and activation process on the founder page.
              </p>
            </div>
            <div className="pricing-callout__actions">
              <Link to={FOUNDING_PAGE_PATH} className="btn btn-primary">
                View Founding Packages
              </Link>
              <Link to="/claim-profile" className="btn btn-outline">
                Claim Existing Profile
              </Link>
            </div>
          </div>

          <div className="features-technical" style={{ marginTop: 'var(--space-12)' }}>
            <h2>Why providers use Wedding Counselors</h2>
            <div className="tech-features">
              <div className="tech-feature">
                <h3><i className="fas fa-dollar-sign"></i> No Per-Lead Fees</h3>
                <p>
                  Couples contact you directly. We do not take a commission from your sessions.
                </p>
              </div>

              <div className="tech-feature">
                <h3><i className="fas fa-envelope"></i> Direct Contact</h3>
                <p>
                  Your email and phone stay in your control. There is no marketplace middleman between you and the couple.
                </p>
              </div>

              <div className="tech-feature">
                <h3><i className="fas fa-chart-line"></i> Useful Visibility Upgrades</h3>
                <p>
                  Founder packages are designed around better positioning and cleaner presentation, not vague promises.
                </p>
              </div>

              <div className="tech-feature">
                <h3><i className="fas fa-handshake"></i> Manual Review</h3>
                <p>
                  Paid placements are handled manually right now so the right providers get the right city or specialty surfaces.
                </p>
              </div>
            </div>
          </div>

          <div className="features-hero" style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
            <h2>Start free or go straight to a founder application</h2>
            <p style={{
              maxWidth: '700px',
              margin: '0 auto var(--space-6)',
              color: 'var(--slate)',
              fontSize: 'var(--text-lg)',
              lineHeight: '1.7'
            }}>
              The free listing is the right move if you need to claim your profile first. The founding offer is for providers who already know premarital counseling is a real growth channel for their practice.
            </p>
            <div className="cta-buttons" style={{ marginTop: 'var(--space-6)' }}>
              <Link to="/professional/signup" className="btn btn-outline" rel="nofollow">
                Create Your Free Profile
              </Link>
              <Link to={FOUNDING_PAGE_PATH} className="btn btn-primary">
                Explore Founder Offer
              </Link>
            </div>
          </div>
        </div>
      </div>

      <FAQ
        faqs={pricingFAQs}
        title="Pricing Questions"
        description="What is live right now for provider monetization."
        className="pricing-faq"
        showAside={false}
        showSearch={false}
      />

      <style>{`
        .pricing-page .page-header {
          padding-bottom: var(--space-8);
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-6);
          margin-top: var(--space-8);
        }

        .pricing-card {
          background: var(--white);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--gray-200);
          padding: var(--space-8);
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all var(--transition);
        }

        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .pricing-card--highlighted {
          border-color: var(--teal);
          border-width: 2px;
          box-shadow: var(--shadow-md);
        }

        .pricing-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--teal);
          color: var(--white);
          padding: var(--space-1) var(--space-4);
          border-radius: 9999px;
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
          white-space: nowrap;
        }

        .pricing-card__header {
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .pricing-card__name {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: var(--weight-bold);
          color: var(--teal);
          margin-bottom: var(--space-3);
        }

        .pricing-card__price {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: var(--space-1);
          margin-bottom: var(--space-3);
        }

        .pricing-card__amount {
          font-family: var(--font-display);
          font-size: var(--text-4xl);
          font-weight: var(--weight-bold);
          color: var(--charcoal);
        }

        .pricing-card__period {
          font-size: var(--text-base);
          color: var(--slate);
        }

        .pricing-card__description {
          font-size: var(--text-sm);
          color: var(--slate);
          line-height: 1.6;
          margin: 0;
        }

        .pricing-card__features {
          flex: 1;
          margin-bottom: var(--space-6);
        }

        .pricing-card__features ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .pricing-card__features li {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-2) 0;
          color: var(--charcoal);
          font-size: var(--text-sm);
          line-height: 1.5;
        }

        .pricing-card__features li i {
          color: var(--teal);
          font-size: var(--text-sm);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .pricing-card__cta {
          margin-top: auto;
        }

        .pricing-card__cta .btn-block {
          width: 100%;
          text-align: center;
          padding: var(--space-4) var(--space-6);
        }

        .pricing-callout {
          margin-top: var(--space-10);
          padding: var(--space-8);
          border-radius: var(--radius-2xl);
          background: linear-gradient(135deg, rgba(14, 94, 94, 0.96), rgba(24, 98, 89, 0.96));
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-6);
        }

        .pricing-callout h2,
        .pricing-callout p {
          color: var(--white);
        }

        .pricing-callout p {
          opacity: 0.9;
          max-width: 640px;
        }

        .pricing-callout__actions {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .pricing-callout__actions .btn.btn-outline {
          border-color: rgba(255, 255, 255, 0.85);
          color: var(--white);
        }

        .pricing-callout__actions .btn.btn-outline:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          color: var(--white);
        }

        .pricing-faq {
          background: var(--gray-50);
        }

        @media (max-width: 1024px) {
          .pricing-grid {
            gap: var(--space-4);
          }

          .pricing-card {
            padding: var(--space-6);
          }

          .pricing-card__amount {
            font-size: var(--text-3xl);
          }

          .pricing-callout {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 440px;
            margin-left: auto;
            margin-right: auto;
          }

          .pricing-card__name {
            font-size: var(--text-xl);
          }

          .pricing-card__amount {
            font-size: var(--text-2xl);
          }

          .pricing-callout {
            padding: var(--space-6);
          }

          .pricing-callout__actions {
            width: 100%;
            flex-direction: column;
          }

          .pricing-callout__actions .btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}

export default PricingPage
