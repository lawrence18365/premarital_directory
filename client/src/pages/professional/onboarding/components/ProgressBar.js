import React from 'react'
import { TOTAL_QUESTIONS } from '../constants'

const ProgressBar = ({ currentStep, saving }) => {
  const progress = (currentStep / TOTAL_QUESTIONS) * 100

  return (
    <div className="onboarding-progress">
      <div className="progress-step-dots" aria-hidden="true">
        {Array.from({ length: TOTAL_QUESTIONS }).map((_, index) => {
          const stepNumber = index + 1
          const dotClass = stepNumber < currentStep
            ? 'is-complete'
            : stepNumber === currentStep
              ? 'is-current'
              : ''
          return <span key={stepNumber} className={`progress-step-dot ${dotClass}`}></span>
        })}
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {saving && (
        <span className="saving-indicator">
          <i className="fa fa-circle-o-notch fa-spin"></i> Saving to your profile...
        </span>
      )}
    </div>
  )
}

export default ProgressBar
