import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import { STATE_CONFIG } from '../data/locationConfig'
import { generateSlug } from '../lib/utils'

const LocationsDirectoryPage = () => {
    // Sort states alphabetically by name
    const sortedStates = Object.entries(STATE_CONFIG).sort((a, b) =>
        a[1].name.localeCompare(b[1].name)
    )

    return (
        <>
            <SEOHelmet
                title="Find Premarital Counselors by Location | Directory"
                description="Browse our complete directory of premarital counselors, therapists, and wedding officiants across all 50 US states and major cities."
                canonicalUrl="/locations"
            />

            <div className="container locations-directory">
                <header className="locations-header" style={{ padding: 'var(--space-12) 0 var(--space-8)', textAlign: 'center' }}>
                    <h1>Explore Counselors by Location</h1>
                    <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        Find trusted premarital counselors and marriage prep specialists in your state and city.
                    </p>
                </header>

                <div className="state-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 'var(--space-8)',
                    paddingBottom: 'var(--space-16)'
                }}>
                    {sortedStates.map(([stateSlug, stateData]) => (
                        <div key={stateSlug} className="state-card" style={{
                            background: 'white',
                            padding: 'var(--space-6)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                            border: '1px solid var(--gray-200)'
                        }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                                <Link to={`/premarital-counseling/${stateSlug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {stateData.name} ({stateData.abbr})
                                </Link>
                            </h2>

                            {stateData.major_cities && stateData.major_cities.length > 0 && (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {stateData.major_cities.sort().map(city => (
                                        <li key={city}>
                                            <Link
                                                to={`/premarital-counseling/${stateSlug}/${generateSlug(city)}`}
                                                style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                                                onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'}
                                                onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
                                            >
                                                {city}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

export default LocationsDirectoryPage
