import React from 'react'

const PremiumLoader = ({ text = 'Preparing your experience…' }) => {
  return (
    <div className="wc-loader" role="status" aria-live="polite" aria-label="Loading" aria-busy="true">
      <div className="wc-loader__inner">
        <div className="wc-loader__ring">
          <div className="wc-loader__ring-glow" />
          <div className="wc-loader__ring-track" />
          <div className="wc-loader__ring-fill" />
          <div className="wc-loader__spark" aria-hidden />
        </div>
        <div className="wc-loader__brand">
          <span className="wc-loader__brand-text">Wedding Counselors</span>
        </div>
        {text && <p className="wc-loader__text">{text}</p>}
      </div>
      <div className="wc-loader__gradient" aria-hidden />
    </div>
  )
}

export default PremiumLoader
