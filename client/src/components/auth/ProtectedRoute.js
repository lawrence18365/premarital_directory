import { useAuth } from '../../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

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