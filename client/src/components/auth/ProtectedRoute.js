import { useAuth } from '../../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, loading, isAdmin, profileLoadFailed, retryProfileLoad } = useAuth()
  const location = useLocation()
  const isOnboardingRoute = location.pathname.startsWith('/professional/onboarding')
  const requiresCompletedOnboarding =
    location.pathname.startsWith('/professional/') && !isOnboardingRoute

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    // Save the attempted location for redirect after login
    return <Navigate to="/professional/login" state={{ from: location }} replace />
  }

  // Profile failed to load (timeout/network) — show retry instead of redirecting to onboarding
  if (profileLoadFailed && !profile && requiresCompletedOnboarding) {
    return (
      <div className="loading-container">
        <p>We had trouble loading your profile. This is usually a temporary issue.</p>
        <button
          onClick={retryProfileLoad}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  if (
    !requireAdmin &&
    requiresCompletedOnboarding &&
    !isAdmin &&
    (!profile || !profile.onboarding_completed)
  ) {
    return <Navigate to="/professional/onboarding" replace />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="unauthorized-container">
        <div className="error-card">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Admin access is required.</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
