import React from 'react'
import { getOffers, AFFILIATE_DISCLOSURE } from '../../lib/affiliateOffers'
import '../../assets/css/affiliate-offers.css'

/**
 * AffiliateOffers
 *
 * Renders the verified partner offers relevant to a page, with the required
 * FTC disclosure. Shows nothing if there are no actionable offers for the
 * context — so it is safe to place before any program is approved.
 *
 * Usage:
 *   <AffiliateOffers context="therapy" heading="Get help as a couple" />
 *   <AffiliateOffers context="books" />
 *   <AffiliateOffers context="license" />
 */
const AffiliateOffers = ({ context, heading, intro }) => {
  const offers = getOffers(context)
  if (offers.length === 0) return null

  return (
    <section className="affiliate-offers" aria-label="Recommended partners">
      {heading ? <h2 className="affiliate-offers__heading">{heading}</h2> : null}
      {intro ? <p className="affiliate-offers__intro">{intro}</p> : null}

      <ul className="affiliate-offers__list">
        {offers.map((offer) => (
          <li key={offer.id} className="affiliate-offers__card">
            <div className="affiliate-offers__card-body">
              <div className="affiliate-offers__card-head">
                <h3 className="affiliate-offers__name">{offer.name}</h3>
                {offer.bestFor ? (
                  <p className="affiliate-offers__best-for">{offer.bestFor}</p>
                ) : null}
              </div>
              <p className="affiliate-offers__blurb">{offer.blurb}</p>
            </div>
            <a
              className="affiliate-offers__cta"
              href={offer.url}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              {offer.cta || 'Learn more'}
            </a>
          </li>
        ))}
      </ul>

      <p className="affiliate-offers__disclosure">{AFFILIATE_DISCLOSURE}</p>
    </section>
  )
}

export default AffiliateOffers
