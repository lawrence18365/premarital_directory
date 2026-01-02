import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CityPage from '../../pages/CityPage'
import ProfilePage from '../../pages/ProfilePage'
import LoadingSpinner from '../common/LoadingSpinner'
import { STATE_CONFIG } from '../../data/locationConfig'
import { profileOperations } from '../../lib/supabaseClient'

const CityOrProfilePage = ({ stateOverride, cityOrSlugOverride }) => {
  const params = useParams()
  const state = stateOverride || params.state
  const cityOrSlug = cityOrSlugOverride || params.cityOrSlug
  
  const [isCity, setIsCity] = useState(null) // null = loading, true = city, false = profile
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    determinePageType()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, cityOrSlug])

  const determinePageType = async () => {
    try {
      setLoading(true)
      
      // Check if cityOrSlug exists
      if (!cityOrSlug) {
        setIsCity(true)
        setLoading(false)
        return
      }
      
      // First check if it's a known city
      const stateConfig = STATE_CONFIG[state]
      if (stateConfig) {
        const cityName = cityOrSlug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
        
        const isKnownCity = stateConfig.major_cities.some(city => 
          city.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '') === cityOrSlug ||
          city.toLowerCase() === cityName.toLowerCase()
        )
        
        if (isKnownCity) {
          setIsCity(true)
          setLoading(false)
          return
        }
      }
      
      // If not a known city, check if it's a profile
      // Try to load profile by slug/ID
      const { data, error } = await profileOperations.getProfileBySlug(cityOrSlug)
      
      if (data && !error) {
        // It's a profile
        setIsCity(false)
      } else {
        // Not a profile either, assume it's a city (maybe not in our major cities list)
        setIsCity(true)
      }
      
    } catch (err) {
      // On error, default to city page
      setIsCity(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <LoadingSpinner />
      </div>
    )
  }

  // Render appropriate page with props
  if (isCity) {
    return <CityPage stateOverride={state} cityOverride={cityOrSlug} />
  } else {
    return <ProfilePage stateOverride={state} cityOverride={cityOrSlug} />
  }
}

export default CityOrProfilePage