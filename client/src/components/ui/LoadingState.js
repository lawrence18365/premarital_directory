import React from 'react'
import LoadingSpinner from '../common/LoadingSpinner'
import './ui.css'

/*
 * LoadingState
 * Governed loading layout that reuses the existing LoadingSpinner. Optionally
 * shows a description below the spinner text.
 *
 * Props:
 *   text         spinner label (passed to LoadingSpinner)
 *   size         "small" | "normal" | "large" (passed to LoadingSpinner)
 *   description  string | node shown beneath the spinner
 */
const LoadingState = ({ text = 'Loading...', size = 'normal', description, className = '', ...rest }) => {
  const classes = ['ui-state', 'ui-state--loading', className].filter(Boolean).join(' ')

  return (
    <div className={classes} aria-busy="true" aria-live="polite" {...rest}>
      <LoadingSpinner text={text} size={size} />
      {description && <p className="ui-state__description">{description}</p>}
    </div>
  )
}

export default LoadingState
