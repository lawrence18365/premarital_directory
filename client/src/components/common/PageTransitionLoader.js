import React from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'

import PremiumLoader from './PremiumLoader'

const MIN_VISIBLE_MS = 550

const PageTransitionLoader = () => {
  const location = useLocation()
  const [active, setActive] = React.useState(false)
  const firstPaintRef = React.useRef(true)
  const hideTimerRef = React.useRef(null)

  React.useEffect(() => {
    if (firstPaintRef.current) {
      firstPaintRef.current = false
      return
    }
    // Show loader on route change
    setActive(true)
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setActive(false), MIN_VISIBLE_MS)
    return () => clearTimeout(hideTimerRef.current)
  }, [location])

  if (!active) return null
  return createPortal(<PremiumLoader text="Loading…" />, document.body)
}

export default PageTransitionLoader

