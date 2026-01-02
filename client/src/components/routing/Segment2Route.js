import React from 'react'
import { useParams } from 'react-router-dom'
import { getSpecialtyBySlug } from '../../data/specialtyConfig'

// Lazy load target components
const SpecialtyStatePage = React.lazy(() => import('../../pages/SpecialtyStatePage'))
const CityOrProfilePage = React.lazy(() => import('./CityOrProfilePage'))

const Segment2Route = () => {
  // We capture generic params from the route definition in App.js
  // Expected route: /premarital-counseling/:param1/:param2
  const { param1, param2 } = useParams()

  // Check if param1 is a specialty
  const isSpecialty = !!getSpecialtyBySlug(param1)

  if (isSpecialty) {
    // URL structure: /premarital-counseling/[specialty]/[state]
    // We need to remap params for the target component if it expects specific names
    // But since we are rendering it directly, we can just rely on useParams in the child
    // However, useParams will return { param1, param2 }.
    // The child components (SpecialtyStatePage) expect { specialty, state }.
    // This is a problem because useParams reads from the Router context.
    
    // Solution: We can't easily override useParams context without a new Route.
    // BUT, we can make the child components smarter or pass props.
    // Since I just created SpecialtyStatePage, let's update it to support props OR params.
    // OR, simpler: Modify App.js to use distinct routes if possible. 
    
    // Wait, if I use <Route path="..." element={<Segment2Route />} />, 
    // the params in the URL are what they are.
    
    // If I use a wrapper like this, I might need to mock the context or pass props.
    // Let's pass props to the page components and update them to use props if available, fallback to params.
    
    // Actually, React Router v6 doesn't let us easily rewrite params.
    // Let's check SpecialtyStatePage again. It uses:
    // const { specialty: specialtySlug, state: stateSlug } = useParams()
    
    // If I use this Segment2Route, the params will be { param1: 'christian', param2: 'texas' }.
    // So SpecialtyStatePage will get undefined for 'specialty' and 'state'.
    
    // FIX: I will update SpecialtyStatePage and SpecialtyCityPage to accept props overrides.
    return <SpecialtyStatePage specialtyOverride={param1} stateOverride={param2} />
  }

  // URL structure: /premarital-counseling/[state]/[cityOrSlug]
  return <CityOrProfilePage stateOverride={param1} cityOrSlugOverride={param2} />
}

export default Segment2Route
