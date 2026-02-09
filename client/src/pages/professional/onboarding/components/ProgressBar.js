import React from 'react'
import { TOTAL_QUESTIONS } from '../constants'

const ProgressBar = ({ currentStep, saving }) => {
  const progress = (currentStep / TOTAL_QUESTIONS) * 100

  return (
    <div className="onboarding-progress">
      <div className="progress-info">
        <span className="progress-text">
          Step {currentStep}
        </span>
        {saving && (
          <span className="saving-indicator">
            <i className="fa fa-circle-o-notch fa-spin"></i> Saving...
          </span>
        )}
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}

export default ProgressBar
