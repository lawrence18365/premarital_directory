import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { clientFocusOptions } from '../../constants'

const Q11_ClientFocus = ({
  currentStep,
  profileData,
  toggleArrayField,
  saving,
  error,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const handleContinue = async () => {
    await goToNextQuestion(currentStep)
  }

  const handleSkip = async () => {
    await goToNextQuestion(currentStep)
  }

  return (
    <QuestionContainer
      currentStep={currentStep}
      saving={saving}
      error={error}
      onBack={goToPreviousQuestion}
      onContinue={handleContinue}
      onSkip={handleSkip}
      canSkip={true}
    >
      <div className="form-group">
        <label className="form-label">
          What types of couples do you work with?
          <span className="form-label-subtitle">
            Select all that apply
          </span>
        </label>
        <div className="chip-container">
          {clientFocusOptions.map((focus) => (
            <div
              key={focus}
              className={`chip ${profileData.client_focus?.includes(focus) ? 'selected' : ''}`}
              onClick={() => toggleArrayField('client_focus', focus)}
            >
              {focus}
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q11_ClientFocus
