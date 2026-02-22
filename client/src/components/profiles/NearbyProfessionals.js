import React, { useState, useEffect } from 'react'
import { profileOperations } from '../../lib/supabaseClient'
import ProfileCard from './ProfileCard'
import { Link } from 'react-router-dom'
import { generateSlug, getStateNameFromAbbr } from '../../lib/utils'

const NearbyProfessionals = ({ currentProfile }) => {
    const [profiles, setProfiles] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const fetchNearby = async () => {
            // Abort if missing location basics or id
            if (!currentProfile?.state_province || !currentProfile?.city || !currentProfile?.id) {
                setLoading(false)
                return
            }

            try {
                const { data, error } = await profileOperations.getNearbyProfiles(
                    currentProfile.state_province,
                    currentProfile.city,
                    currentProfile.id,
                    4 // Limit to 4 for a visually balanced row/grid
                )

                if (!error && data && mounted) {
                    setProfiles(data)
                }
            } catch (err) {
                console.error('Error fetching nearby profiles:', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchNearby()

        return () => { mounted = false }
    }, [currentProfile?.id, currentProfile?.city, currentProfile?.state_province])

    if (loading || profiles.length === 0) return null

    const stateSlug = getStateNameFromAbbr(currentProfile.state_province)
    const citySlug = generateSlug(currentProfile.city)

    return (
        <section className="profile-premium-card profile-premium-nearby">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0 }}>More Providers in {currentProfile.city}</h2>
                {stateSlug && citySlug && (
                    <Link to={`/premarital-counseling/${stateSlug}/${citySlug}`} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                        View All in {currentProfile.city}
                    </Link>
                )}
            </div>

            <div className="nearby-profiles-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                {profiles.map(profile => (
                    <ProfileCard key={profile.id} profile={profile} type="grid" />
                ))}
            </div>
        </section>
    )
}

export default NearbyProfessionals
