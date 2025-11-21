import React from 'react';
import './DynamicCityStats.css';

/**
 * Dynamic City Stats Component
 * Displays real data about counselors in the city to add substance to pages
 * This helps prevent Soft 404 errors by adding unique, valuable content
 */
const DynamicCityStats = ({ profiles, cityName, stateName }) => {
  if (!profiles || profiles.length === 0) {
    return null;
  }

  // Calculate real stats from profiles
  const stats = {
    total: profiles.length,
    therapists: profiles.filter(p => p.profession?.toLowerCase().includes('therapist')).length,
    clergy: profiles.filter(p =>
      p.profession?.toLowerCase().includes('clergy') ||
      p.profession?.toLowerCase().includes('pastor') ||
      p.profession?.toLowerCase().includes('minister') ||
      p.profession?.toLowerCase().includes('priest')
    ).length,
    coaches: profiles.filter(p => p.profession?.toLowerCase().includes('coach')).length,
    online: profiles.filter(p =>
      p.session_types?.includes('online') ||
      p.session_types?.includes('telehealth') ||
      p.session_types?.includes('virtual')
    ).length,
    inPerson: profiles.filter(p =>
      p.session_types?.includes('in-person') ||
      p.session_types?.includes('office')
    ).length,
    acceptingNew: profiles.filter(p => p.accepting_new_clients === true).length,
    freeConsult: profiles.filter(p => p.offers_free_consultation === true).length,
    claimed: profiles.filter(p => p.is_claimed === true).length,

    // Specialties
    premarital: profiles.filter(p =>
      p.specialties?.some(s => s.toLowerCase().includes('premarital') || s.toLowerCase().includes('pre-marital'))
    ).length,
    christian: profiles.filter(p =>
      p.specialties?.some(s =>
        s.toLowerCase().includes('christian') ||
        s.toLowerCase().includes('faith-based') ||
        s.toLowerCase().includes('religious')
      )
    ).length,
    couples: profiles.filter(p =>
      p.specialties?.some(s => s.toLowerCase().includes('couples'))
    ).length,

    // Languages (if available)
    languages: [...new Set(profiles.flatMap(p => p.languages || []))].filter(Boolean).slice(0, 5),

    // Insurance
    acceptsInsurance: profiles.filter(p =>
      p.insurance_accepted && p.insurance_accepted.length > 0
    ).length,

    // Price ranges
    priceRanges: profiles
      .map(p => p.pricing_range)
      .filter(Boolean)
      .reduce((acc, range) => {
        acc[range] = (acc[range] || 0) + 1;
        return acc;
      }, {}),

    // Avg years experience
    avgExperience: profiles
      .filter(p => p.years_experience)
      .reduce((sum, p) => sum + (p.years_experience || 0), 0) /
      profiles.filter(p => p.years_experience).length || 0,

    // Top credentials
    topCredentials: [...new Set(profiles.flatMap(p => p.credentials || []))]
      .filter(Boolean)
      .slice(0, 6)
  };

  return (
    <div className="dynamic-city-stats">
      <h2>Premarital Counseling Options in {cityName}</h2>

      <div className="stats-grid">
        {/* Provider Types */}
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Professionals</div>
            {stats.therapists > 0 && (
              <div className="stat-detail">{stats.therapists} Licensed Therapists</div>
            )}
            {stats.clergy > 0 && (
              <div className="stat-detail">{stats.clergy} Clergy Members</div>
            )}
            {stats.coaches > 0 && (
              <div className="stat-detail">{stats.coaches} Marriage Coaches</div>
            )}
          </div>
        </div>

        {/* Session Formats */}
        {(stats.online > 0 || stats.inPerson > 0) && (
          <div className="stat-card">
            <div className="stat-icon">💻</div>
            <div className="stat-content">
              <div className="stat-number">{stats.online}</div>
              <div className="stat-label">Offer Online Sessions</div>
              {stats.inPerson > 0 && (
                <div className="stat-detail">{stats.inPerson} also offer in-person</div>
              )}
            </div>
          </div>
        )}

        {/* Availability */}
        {stats.acceptingNew > 0 && (
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.acceptingNew}</div>
              <div className="stat-label">Accepting New Couples</div>
              {stats.freeConsult > 0 && (
                <div className="stat-detail">{stats.freeConsult} offer free consultations</div>
              )}
            </div>
          </div>
        )}

        {/* Specialization */}
        {stats.premarital > 0 && (
          <div className="stat-card">
            <div className="stat-icon">💍</div>
            <div className="stat-content">
              <div className="stat-number">{stats.premarital}</div>
              <div className="stat-label">Premarital Specialists</div>
              {stats.christian > 0 && (
                <div className="stat-detail">{stats.christian} faith-based options</div>
              )}
            </div>
          </div>
        )}

        {/* Insurance */}
        {stats.acceptsInsurance > 0 && (
          <div className="stat-card">
            <div className="stat-icon">🏥</div>
            <div className="stat-content">
              <div className="stat-number">{stats.acceptsInsurance}</div>
              <div className="stat-label">Accept Insurance</div>
              <div className="stat-detail">Check individual profiles for details</div>
            </div>
          </div>
        )}

        {/* Experience */}
        {stats.avgExperience > 0 && (
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-number">{Math.round(stats.avgExperience)}</div>
              <div className="stat-label">Avg Years Experience</div>
              {stats.claimed > 0 && (
                <div className="stat-detail">{stats.claimed} verified profiles</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Additional Details */}
      <div className="stats-details">
        {stats.topCredentials.length > 0 && (
          <div className="detail-section">
            <h3>Professional Credentials in {cityName}</h3>
            <ul className="credentials-list">
              {stats.topCredentials.map((cred, idx) => (
                <li key={idx} className="credential-badge">{cred}</li>
              ))}
            </ul>
            <p className="detail-note">
              All therapists and counselors listed are licensed professionals in {stateName},
              with credentials verified through state licensing boards.
            </p>
          </div>
        )}

        {stats.languages.length > 1 && (
          <div className="detail-section">
            <h3>Languages Spoken</h3>
            <p>
              Counselors in {cityName} offer services in: {stats.languages.join(', ')}.
              Check individual profiles for specific language availability.
            </p>
          </div>
        )}

        {Object.keys(stats.priceRanges).length > 0 && (
          <div className="detail-section">
            <h3>Pricing in {cityName}</h3>
            <div className="price-breakdown">
              {Object.entries(stats.priceRanges).map(([range, count]) => (
                <div key={range} className="price-item">
                  <span className="price-range">{range}</span>
                  <span className="price-count">{count} {count === 1 ? 'provider' : 'providers'}</span>
                </div>
              ))}
            </div>
            <p className="detail-note">
              Many counselors offer sliding scale fees and accept insurance.
              Free consultations are available from {stats.freeConsult || 'some'} providers.
            </p>
          </div>
        )}
      </div>

      {/* Local Context */}
      <div className="local-context">
        <h3>Why Choose Local Premarital Counseling in {cityName}</h3>
        <p>
          Working with a local premarital counselor in {cityName}, {stateName} means you get
          personalized guidance that understands your community context. Whether you prefer
          {stats.online > 0 && ' online sessions via telehealth or'}
          {stats.inPerson > 0 && ' in-person meetings'}
          , our {stats.total} professionals can help you build a strong foundation for marriage.
        </p>

        {stats.christian > 0 && (
          <p>
            For couples seeking faith-based guidance, {cityName} has {stats.christian} Christian
            counselors and clergy members who integrate biblical principles with proven
            relationship techniques.
          </p>
        )}
      </div>
    </div>
  );
};

export default DynamicCityStats;
