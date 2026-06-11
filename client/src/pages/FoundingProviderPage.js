import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import FAQ from '../components/common/FAQ'
import {
  CONTACT_EMAIL,
  FOUNDING_PAGE_PATH,
  FOUNDING_PACKAGES,
  buildFoundingInquiryPath,
  buildFoundingMailto
} from '../lib/providerOffers'
import '../assets/css/founding-provider.css'

const fitSignals = [
  {
    title: 'Premarital specialists',
    description: 'Therapists, coaches, clergy, and educators who actively work with engaged couples.'
  },
  {
    title: 'Providers accepting new clients',
    description: 'The best fit is someone who can actually take new couples in the near term.'
  },
  {
    title: 'Clear service positioning',
    description: 'Faith-based, Gottman, PREPARE/ENRICH, online, local, or another clear specialty.'
  },
  {
    title: 'Practices ready for visibility',
    description: 'You already have intake capacity, response processes, and a profile worth sharpening.'
  }
]

const activationSteps = [
  {
    title: 'Apply',
    description: 'Tell us your target city or specialty, your main method, and whether you are taking new couples.'
  },
  {
    title: 'Confirm fit',
    description: 'We confirm whether the requested placement is available and recommend the right founding package.'
  },
  {
    title: 'Activate',
    description: 'We clean up the profile, apply the package, and confirm when the placement is live.'
  }
]

const foundingFAQs = [
  {
    question: 'Do you guarantee a number of leads?',
    answer: 'No. These are visibility and positioning packages, not guaranteed lead-volume products.'
  },
  {
    question: 'Is this a monthly subscription?',
    answer: 'No. Founding packages are one-time and activated manually after we confirm fit and availability.'
  },
  {
    question: 'Can I choose my city or specialty?',
    answer: 'Yes. We confirm the target placement before activation so expectations are clear.'
  },
  {
    question: 'Do I need an existing profile first?',
    answer: 'No. You can create a free profile first or apply directly and we will tell you the cleanest next step.'
  }
]

const featuredMeaning = [
  'Higher on-page placement within one approved market',
  'A visible founding badge and cleaner trust signals',
  'Profile copy tuned for engaged couples rather than generic therapy traffic',
  'Manual review so placements stay relevant and limited'
]

const FoundingProviderPage = () => {
  return (
    <div className="founding-provider-page">
      <SEOHelmet
        title="Founding Provider Packages for Premarital Counselors"
        description="Apply for one-time founding provider packages on WeddingCounselors.com. Get featured placement, profile optimization, and early visibility in your city or specialty."
        url={FOUNDING_PAGE_PATH}
        keywords="premarital counselor marketing, therapist directory pricing, featured therapist listing, premarital counseling leads"
      />

      <section className="founding-hero">
        <div className="container founding-hero__grid">
          <div className="founding-hero__copy">
            <p className="founding-eyebrow">For premarital counselors, therapists, coaches, and clergy</p>
            <h1>Become a founding featured provider</h1>
            <p className="founding-lead">
              One-time visibility packages for providers who want early placement while the marketplace grows.
            </p>

            <div className="founding-pill-row" aria-label="Key terms">
              <span>One-time packages</span>
              <span>Manual activation</span>
              <span>City or specialty placement</span>
            </div>

            <div className="founding-actions">
              <Link to={buildFoundingInquiryPath()} className="btn btn-primary">
                Apply as Founding Provider
              </Link>
              <a href={buildFoundingMailto()} className="btn btn-outline">
                Email {CONTACT_EMAIL}
              </a>
            </div>

            <p className="founding-note">
              Self-serve monthly billing is not live yet. Founding packages are approved and activated manually so placement quality stays high.
            </p>
          </div>

          <aside className="founding-hero__panel">
            <p className="founding-panel__label">What featured means</p>
            <ul className="founding-feature-list">
              {featuredMeaning.map((item) => (
                <li key={item}>
                  <i className="fa fa-check-circle" aria-hidden="true"></i>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="founding-panel__footer">
              <strong>Important:</strong> you are buying early positioning, not guaranteed lead count.
            </div>
          </aside>
        </div>
      </section>

      <section className="founding-section">
        <div className="container">
          <div className="founding-section__header">
            <p className="founding-section__eyebrow">Who this is for</p>
            <h2>Best fit for providers who already know premarital is a real part of their practice</h2>
          </div>

          <div className="founding-fit-grid">
            {fitSignals.map((signal) => (
              <article key={signal.title} className="founding-fit-card">
                <h3>{signal.title}</h3>
                <p>{signal.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="founding-section founding-section--alt">
        <div className="container">
          <div className="founding-section__header">
            <p className="founding-section__eyebrow">Founding packages</p>
            <h2>Choose the level of visibility and support that matches your practice</h2>
            <p>
              All packages are one-time. We confirm availability before anything goes live.
            </p>
          </div>

          <div className="founding-package-grid">
            {FOUNDING_PACKAGES.map((pkg) => (
              <article
                key={pkg.id}
                className={`founding-package-card ${pkg.highlight ? 'founding-package-card--highlighted' : ''}`}
              >
                {pkg.highlight && <div className="founding-package-card__badge">Best first paid offer</div>}

                <div className="founding-package-card__header">
                  <h3>{pkg.name}</h3>
                  <div className="founding-package-card__price">
                    <span className="founding-package-card__amount">{pkg.price}</span>
                    <span className="founding-package-card__suffix">{pkg.priceSuffix}</span>
                  </div>
                  <p>{pkg.summary}</p>
                </div>

                <p className="founding-package-card__duration">{pkg.duration}</p>

                <ul className="founding-package-card__features">
                  {pkg.features.map((feature) => (
                    <li key={feature}>
                      <i className="fa fa-check" aria-hidden="true"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="founding-package-card__actions">
                  <Link to={buildFoundingInquiryPath(pkg)} className="btn btn-primary">
                    {pkg.cta}
                  </Link>
                  <a href={buildFoundingMailto(pkg)} className="founding-package-card__link">
                    Prefer email instead
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="founding-section">
        <div className="container">
          <div className="founding-section__header">
            <p className="founding-section__eyebrow">How it works</p>
            <h2>Simple manual setup while the paid product is still being shaped</h2>
          </div>

          <div className="founding-steps">
            {activationSteps.map((step, index) => (
              <article key={step.title} className="founding-step">
                <div className="founding-step__index">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FAQ
        faqs={foundingFAQs}
        title="Founding Offer Questions"
        description="What to expect before you apply."
        className="founding-faq"
        showAside={false}
        showSearch={false}
        highlights={[
          'One-time packages only',
          'No guaranteed lead promises',
          'Placement confirmed before activation'
        ]}
      />

      <section className="founding-bottom-cta">
        <div className="container founding-bottom-cta__inner">
          <div>
            <p className="founding-section__eyebrow">Next step</p>
            <h2>Apply now or start with a free profile if you are not ready for placement yet</h2>
          </div>
          <div className="founding-bottom-cta__actions">
            <Link to={buildFoundingInquiryPath()} className="btn btn-primary">
              Apply as Founding Provider
            </Link>
            <Link to="/professional/signup" className="btn btn-outline" rel="nofollow">
              Create Free Profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FoundingProviderPage
