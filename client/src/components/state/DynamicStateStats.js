import React from 'react';
import './DynamicStateStats.css';

/**
 * Dynamic State Stats Component
 * Displays real data about counselors across the state
 * Helps prevent Soft 404 errors by adding unique, substantial content
 */
const DynamicStateStats = ({ stateData, stateName }) => {
  if (!stateData || !stateData.cities || stateData.cities.length === 0) {
    return null;
  }

  // Calculate aggregated stats from all cities in the state
  const stats = {
    totalCities: stateData.cities.length,
    totalProfessionals: stateData.totalProfiles || 0,
    citiesWithProfessionals: stateData.cities.filter(c => c.count > 0).length,
    topCities: stateData.cities
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),

    // Coverage percentage
    coveragePercent: stateData.cities.length > 0
      ? Math.round((stateData.cities.filter(c => c.count > 0).length / stateData.cities.length) * 100)
      : 0,
  };

  return (
    <div className="dynamic-state-stats">
      <div className="state-stats-header">
        <h2>Premarital Counseling Coverage Across {stateName}</h2>
        <p className="state-stats-lead">
          Find qualified premarital counselors in {stats.citiesWithProfessionals} cities across {stateName}.
          Browse by city to compare local therapists, clergy, and marriage coaches.
        </p>
      </div>

      <div className="state-stats-grid">
        <div className="state-stat-card state-stat-primary">
          <div className="state-stat-icon" aria-hidden="true">
            <i className="fa fa-map"></i>
          </div>
          <div className="state-stat-content">
            <div className="state-stat-number">{stats.citiesWithProfessionals}</div>
            <div className="state-stat-label">Cities Covered</div>
            <div className="state-stat-detail">
              Out of {stats.totalCities} major cities in {stateName}
            </div>
          </div>
        </div>

        <div className="state-stat-card">
          <div className="state-stat-icon" aria-hidden="true">
            <i className="fa fa-users"></i>
          </div>
          <div className="state-stat-content">
            <div className="state-stat-number">{stats.totalProfessionals}</div>
            <div className="state-stat-label">Total Professionals</div>
            <div className="state-stat-detail">
              Licensed therapists, clergy, and coaches
            </div>
          </div>
        </div>

        <div className="state-stat-card">
          <div className="state-stat-icon" aria-hidden="true">
            <i className="fa fa-map-marker-alt"></i>
          </div>
          <div className="state-stat-content">
            <div className="state-stat-number">{stats.coveragePercent}%</div>
            <div className="state-stat-label">State Coverage</div>
            <div className="state-stat-detail">
              Major metropolitan areas
            </div>
          </div>
        </div>
      </div>

      {stats.topCities.length > 0 && (
        <div className="top-cities-section">
          <h3>Top Cities for Premarital Counseling in {stateName}</h3>
          <p className="top-cities-intro">
            The cities below have the most premarital counselors and therapists available.
            Click any city to browse local professionals.
          </p>

          <div className="top-cities-list">
            {stats.topCities.map((city, idx) => (
              <a
                key={city.slug}
                href={`/premarital-counseling/${stateData.stateSlug}/${city.slug}`}
                className="top-city-card"
              >
                <div className="top-city-rank">#{idx + 1}</div>
                <div className="top-city-content">
                  <div className="top-city-name">{city.name}</div>
                  <div className="top-city-count">
                    {city.count} {city.count === 1 ? 'professional' : 'professionals'}
                  </div>
                </div>
                <div className="top-city-arrow">→</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="state-coverage-note">
        <h4>Finding the Right Premarital Counselor in {stateName}</h4>
        <p>
          Every city page shows licensed professionals who specialize in premarital counseling
          and marriage preparation. Whether you're looking for faith-based guidance, secular
          therapy, or a specific approach like Gottman Method or Prepare/Enrich, you'll find
          detailed profiles with credentials, specialties, pricing, and availability.
        </p>
        <p>
          Many counselors offer both in-person sessions and online telehealth options, making
          it easy to get started regardless of your schedule or location within {stateName}.
        </p>
      </div>
    </div>
  );
};

export default DynamicStateStats;
