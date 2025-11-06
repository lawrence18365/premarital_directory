import React from 'react'
import { Link } from 'react-router-dom'

const ErrorMessage = ({ 
  title = "Oops! Something went wrong", 
  message = "We encountered an unexpected error. Please try again.", 
  showRetry = true,
  onRetry = null,
  showHome = true 
}) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: 'var(--space-12) var(--space-8)', 
      maxWidth: '500px', 
      margin: '0 auto',
      background: 'var(--white)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--gray-200)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{ 
        fontSize: 'var(--text-5xl)', 
        marginBottom: 'var(--space-4)',
        color: 'var(--error)'
      }}>
        !
      </div>
      
      <h2 style={{ 
        color: 'var(--error)', 
        marginBottom: 'var(--space-4)',
        fontSize: 'var(--text-2xl)'
      }}>
        {title}
      </h2>
      
      <p style={{ 
        color: 'var(--gray-600)', 
        marginBottom: 'var(--space-8)',
        lineHeight: '1.6'
      }}>
        {message}
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-4)', 
        justifyContent: 'center', 
        flexWrap: 'wrap' 
      }}>
        {showRetry && (
          <button 
            onClick={handleRetry}
            className="btn btn-primary"
          >
            Try Again
          </button>
        )}
        
        {showHome && (
          <Link to="/" className="btn btn-outline">
            Return Home
          </Link>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage