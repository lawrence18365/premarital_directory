import React from 'react'
import { TOTAL_QUESTIONS } from '../constants'

const ProgressBar = ({ currentStep, saving }) => {
  const progress = (currentStep / TOTAL_QUESTIONS) * 100
  const remainingSteps = TOTAL_QUESTIONS - currentStep
  const remainingMinutes = Math.max(1, Math.ceil(remainingSteps * 0.65))

  return (
    <div className="onboarding-progress">
      <div className="progress-info">
        <div className="progress-info-left">
          <span className="progress-kicker">Your profile progress</span>
          <span className="progress-text">
            Step {currentStep} of {TOTAL_QUESTIONS}
          </span>
        </div>

        <div className="progress-info-right">
          <span className="progress-percent">{Math.round(progress)}%</span>
          <span className="progress-eta">
            {remainingSteps > 0 ? `~${remainingMinutes} min left` : 'Ready to publish'}
          </span>
        </div>
      </div>

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
