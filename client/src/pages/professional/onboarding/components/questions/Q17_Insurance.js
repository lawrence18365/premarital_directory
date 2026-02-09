import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { insuranceOptions } from '../../constants'

const Q17_Insurance = ({
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
          Do you accept insurance?
          <span className="form-label-subtitle">
            Select all insurance providers you accept
          </span>
        </label>
        <div className="chip-container">
          {insuranceOptions.map((insurance) => (
            <div
              key={insurance}
              className={`chip ${profileData.insurance_accepted?.includes(insurance) ? 'selected' : ''}`}
              onClick={() => toggleArrayField('insurance_accepted', insurance)}
            >
              {insurance}
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q17_Insurance
