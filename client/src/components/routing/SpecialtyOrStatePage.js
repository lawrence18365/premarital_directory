import React from 'react'
import { useParams } from 'react-router-dom'
import { getSpecialtyBySlug } from '../../data/specialtyConfig'

// Lazy load both page types
const SpecialtyPage = React.lazy(() => import('../../pages/SpecialtyPage'))
const StatePage = React.lazy(() => import('../../pages/StatePage'))

/**
 * Smart routing component that determines whether to show
 * a specialty page or a state page based on the URL parameter
 */
const SpecialtyOrStatePage = () => {
  const { state: slugParam } = useParams()

  // Check if this slug matches a specialty
  const specialty = getSpecialtyBySlug(slugParam)

  if (specialty) {
    // It's a specialty - render specialty page
    // Pass the slug as 'specialty' param for consistency
    return <SpecialtyPage />
  }

  // Otherwise treat it as a state
  return <StatePage />
}

export default SpecialtyOrStatePage
