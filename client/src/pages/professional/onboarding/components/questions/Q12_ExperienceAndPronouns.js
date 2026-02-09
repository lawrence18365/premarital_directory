import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { yearsOptions, pronounOptions } from '../../constants'

const Q12_ExperienceAndPronouns = ({
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
          How many years of experience do you have?
        </label>
        <select
          className="form-select"
          value={profileData.years_experience || ''}
          onChange={(e) => updateField('years_experience', e.target.value)}
        >
          <option value="">Select years of experience...</option>
          {yearsOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          What are your pronouns?
        </label>
        <div className="chip-container">
          {pronounOptions.map((option) => (
            <div
              key={option.value}
              className={`chip ${profileData.pronouns === option.value ? 'selected' : ''}`}
              onClick={() => updateField('pronouns', option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q12_ExperienceAndPronouns
