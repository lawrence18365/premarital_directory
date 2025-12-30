import { useEffect } from 'react'
import { trackDirectoryLaunch } from './GoogleAnalytics'

const LaunchTracker = () => {
  useEffect(() => {
    // Track launch milestone only once
    const hasTrackedLaunch = localStorage.getItem('directory_launch_tracked')
    
    if (!hasTrackedLaunch) {
      // Track the launch event
      trackDirectoryLaunch()
      
      // Mark as tracked to prevent duplicate events
      localStorage.setItem('directory_launch_tracked', 'true')
      localStorage.setItem('launch_date', new Date().toISOString())
      
      console.log('Wedding Counselors directory launch tracked.')
    }
  }, [])

  return null
}

export default LaunchTracker
