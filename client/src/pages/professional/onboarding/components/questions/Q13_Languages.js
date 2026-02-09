import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { languageOptions } from '../../constants'

const Q13_Languages = ({
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
          What languages do you speak?
          <span className="form-label-subtitle">
            Select all that apply
          </span>
        </label>
        <div className="chip-container">
          {languageOptions.map((language) => (
            <div
              key={language}
              className={`chip ${profileData.languages?.includes(language) ? 'selected' : ''}`}
              onClick={() => toggleArrayField('languages', language)}
            >
              {language}
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q13_Languages
