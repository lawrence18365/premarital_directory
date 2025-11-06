import React from 'react'

const LoadingSpinner = ({ text = "Loading...", size = "normal" }) => {
  const spinnerSize = size === "large" ? "48px" : size === "small" ? "20px" : "32px"
  
  return (
    <div className="loading" style={{ padding: size === "small" ? 'var(--space-4)' : 'var(--space-12)' }}>
      <div 
        className="loading-spinner" 
        style={{ 
          width: spinnerSize, 
          height: spinnerSize,
          borderWidth: size === "small" ? "2px" : "3px"
        }}
      ></div>
      {text && <p style={{ marginTop: 'var(--space-4)', color: 'var(--gray-500)' }}>{text}</p>}
    </div>
  )
}

export default LoadingSpinner