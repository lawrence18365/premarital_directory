import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import FAQ from '../components/common/FAQ'
import '../assets/css/features.css'

// FAQ data for pricing page
const pricingFAQs = [
  {
    question: "Is the free listing really free?",
    answer: "Yes, absolutely. The Community tier is free forever with no hidden fees. You get a basic listing on city pages, direct leads to your email, and access to basic analytics. We believe every premarital counselor should have access to couples searching for help."
  },
  {
    question: "Can I upgrade later?",
    answer: "Yes, you can upgrade to a paid tier at any time from your dashboard. Your profile information stays the same - you just unlock additional visibility features and placement benefits. Downgrade anytime too, no questions asked."
  },
  {
    question: "How do I get leads?",
    answer: "Couples contact you directly through email or phone. When they find your profile in our directory, they reach out to you directly - there's no middleman. You control the relationship from the first contact. We never take a cut or charge per-lead fees."
  },
  {
    question: "What's the difference between tiers?",
    answer: "The main differences are visibility and placement. Free listings appear in city results. Local Featured adds a badge, priority ranking in your city, and a photo gallery. Area Spotlight gives you top placement across multiple cities and homepage visibility for maximum exposure."
  }
]

const PricingPage = () => {
  const tiers = [
    {
      name: 'Community',
      price: 'Free',
      pricePeriod: 'forever',
      description: 'Everything you need to get started and connect with local couples.',
      features: [
        'Basic listing on city pages',
        'City page placement',
        'Direct leads to your email',
        'Basic analytics dashboard'
      ],
      cta: 'Create Free Profile',
      ctaLink: '/professional/signup',
      highlighted: false,
      available: true
    },
    {
      name: 'Local Featured',
      price: '$49',
      pricePeriod: '/month',
      description: 'Stand out in your city with premium visibility and enhanced profile features.',
      features: [
        'Everything in Community',
        'Featured badge on profile',
        'Priority ranking in your city',
        'Photo gallery (up to 6 images)',
        'Highlighted profile card'
      ],
      cta: 'Join Waitlist',
      ctaLink: null,
      highlighted: true,
      available: false
    },
    {
      name: 'Area Spotlight',
      price: '$99',
      pricePeriod: '/month',
      description: 'Maximum visibility across your service area with premium placement everywhere.',
      features: [
        'Everything in Local Featured',
        'Top placement in search results',
        'Multi-city featuring (up to 5 cities)',
        'Homepage spotlight rotation',
        'Priority support'
      ],
      cta: 'Coming Soon',
      ctaLink: null,
      highlighted: false,
      available: false
    }
  ]

  return (
    <div className="page-container features-page pricing-page">
      <SEOHelmet
        title="Pricing for Premarital Counselors"
        description="List your premarital counseling practice for free. Upgrade for featured placement, priority ranking, and multi-city visibility. No per-lead fees, ever."
        url="/pricing"
        noindex={false}
        keywords="premarital counselor listing, therapist directory pricing, counselor marketing, get more clients"
      />

      <div className="container">
        <div className="page-header">
          <h1>Simple, Transparent Pricing</h1>
          <p className="lead">
            Start free and grow your practice. No per-lead fees, no commissions -
            couples contact you directly.
          </p>
        </div>

        <div className="content-section">
          {/* Pricing Tiers Grid */}
          <div className="pricing-grid">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`pricing-card ${tier.highlighted ? 'pricing-card--highlighted' : ''}`}
              >
                {tier.highlighted && (
                  <div className="pricing-badge">Most Popular</div>
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
                  {tier.available ? (
                    <Link
                      to={tier.ctaLink}
                      className={`btn ${tier.highlighted ? 'btn-primary' : 'btn-outline'} btn-block`}
                    >
                      {tier.cta}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={`btn ${tier.highlighted ? 'btn-primary' : 'btn-outline'} btn-block`}
                      disabled
                    >
                      {tier.cta}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Value Propositions */}
          <div className="features-technical" style={{ marginTop: 'var(--space-12)' }}>
            <h2>Why List With Us?</h2>
            <div className="tech-features">
              <div className="tech-feature">
                <h3><i className="fas fa-dollar-sign"></i> No Per-Lead Fees</h3>
                <p>
                  Unlike other directories, we never charge you for leads or take a
                  commission. Couples contact you directly - you keep 100% of your fees.
                </p>
              </div>

              <div className="tech-feature">
                <h3><i className="fas fa-envelope"></i> Direct Contact</h3>
                <p>
                  Your email and phone go directly to couples. No middleman, no
                  delayed inquiries - just real connections with engaged couples.
                </p>
              </div>

              <div className="tech-feature">
                <h3><i className="fas fa-chart-line"></i> Track Your Results</h3>
                <p>
                  See how many couples view your profile, reveal your contact info,
                  and reach out. Make data-driven decisions about your online presence.
                </p>
              </div>

              <div className="tech-feature">
                <h3><i className="fas fa-edit"></i> Easy Updates</h3>
                <p>
                  Update your profile anytime - specialties, availability, pricing,
                  and more. Changes go live immediately, no approval needed.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Note */}
          <div className="features-hero" style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
            <h2>Built for Premarital Counselors</h2>
            <p style={{
              maxWidth: '700px',
              margin: '0 auto var(--space-6)',
              color: 'var(--slate)',
              fontSize: 'var(--text-lg)',
              lineHeight: '1.7'
            }}>
              Whether you're a licensed therapist, certified coach, or clergy member,
              our directory helps couples find professionals who specialize in
              pre-marriage preparation. Get listed where engaged couples are already searching.
            </p>
            <div className="cta-buttons" style={{ marginTop: 'var(--space-6)' }}>
              <Link to="/professional/signup" className="btn btn-primary">
                Create Your Free Profile
              </Link>
              <Link to="/features" className="btn btn-outline">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <FAQ
        faqs={pricingFAQs}
        title="Pricing Questions"
        description="Common questions about listing your practice on Wedding Counselors."
        className="pricing-faq"
        showAside={false}
        showSearch={false}
      />

      {/* Inline styles for pricing-specific elements */}
      <style>{`
        .pricing-page .page-header {
          padding-bottom: var(--space-8);
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

        .pricing-card__cta .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
        }

        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          }

          .pricing-card__name {
            font-size: var(--text-xl);
          }

          .pricing-card__amount {
            font-size: var(--text-2xl);
          }
        }
      `}</style>
    </div>
  )
}

export default PricingPage
