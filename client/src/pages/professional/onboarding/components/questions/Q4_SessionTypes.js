import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { sessionTypeOptions } from '../../constants'

const Q4_SessionTypes = ({
  currentStep,
  profileData,
  toggleArrayField,
  saving,
  error,
  setError,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const handleContinue = async () => {
    // Validation
    if (!profileData.session_types || profileData.session_types.length === 0) {
      setError('Please select at least one session type')
      return
    }

    // Save and navigate
    await goToNextQuestion(currentStep)
  }

  return (
    <QuestionContainer
      currentStep={currentStep}
      saving={saving}
      error={error}
      onBack={goToPreviousQuestion}
      onContinue={handleContinue}
    >
      <div className="form-group">
        <label className="form-label">
          How do you meet with clients?
          <span className="form-label-subtitle">
            Select all that apply
          </span>
        </label>
        <div className="chip-container">
          {sessionTypeOptions.map((option) => (
            <div
              key={option.value}
              className={`chip ${profileData.session_types?.includes(option.value) ? 'selected' : ''}`}
              onClick={() => toggleArrayField('session_types', option.value)}
            >
              <i className={`fa ${option.icon}`} style={{ marginRight: '0.5rem' }}></i>
              {option.label}
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q4_SessionTypes
