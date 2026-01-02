import React from 'react'
import { useParams } from 'react-router-dom'
import { getSpecialtyBySlug } from '../../data/specialtyConfig'

// Lazy load target components
const SpecialtyCityPage = React.lazy(() => import('../../pages/SpecialtyCityPage'))
const ProfilePage = React.lazy(() => import('../../pages/ProfilePage'))

const Segment3Route = () => {
  // Expected route: /premarital-counseling/:param1/:param2/:param3
  const { param1, param2, param3 } = useParams()

  // Check if param1 is a specialty
  const isSpecialty = !!getSpecialtyBySlug(param1)

  if (isSpecialty) {
    // URL structure: /premarital-counseling/[specialty]/[state]/[city]
    return (
      <SpecialtyCityPage 
        specialtyOverride={param1} 
        stateOverride={param2} 
        cityOverride={param3} 
      />
    )
  }

  // URL structure: /premarital-counseling/[state]/[city]/[profileSlug]
  return (
    <ProfilePage 
      stateOverride={param1}
      cityOverride={param2}
      profileSlugOverride={param3}
    />
  )
}

export default Segment3Route
