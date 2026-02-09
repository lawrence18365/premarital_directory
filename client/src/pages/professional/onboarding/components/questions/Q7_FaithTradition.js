import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { faithTraditionOptions } from '../../constants'

const Q7_FaithTradition = ({
  currentStep,
  profileData,
  updateField,
  saving,
  error,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const handleContinue = async () => {
    await goToNextQuestion(currentStep)
  }

  const handleSkip = async () => {
    updateField('faith_tradition', '')
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
          What's your faith tradition?
          <span className="form-label-subtitle">
            This helps couples find counselors who align with their beliefs
          </span>
        </label>
        <div className="radio-group">
          {faithTraditionOptions.map((option) => (
            <div
              key={option.value}
              className={`radio-option ${profileData.faith_tradition === option.value ? 'selected' : ''}`}
              onClick={() => updateField('faith_tradition', option.value)}
            >
              <input
                type="radio"
                name="faith_tradition"
                value={option.value}
                checked={profileData.faith_tradition === option.value}
                onChange={() => updateField('faith_tradition', option.value)}
              />
              <span className="radio-option-label">{option.label}</span>
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q7_FaithTradition
