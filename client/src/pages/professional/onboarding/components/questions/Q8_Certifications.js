import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { certificationOptions } from '../../constants'

const Q8_Certifications = ({
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
          Do you have any premarital counseling certifications?
          <span className="form-label-subtitle">
            Select all that apply
          </span>
        </label>
        <div className="chip-container">
          {certificationOptions.map((cert) => (
            <div
              key={cert}
              className={`chip ${profileData.certifications?.includes(cert) ? 'selected' : ''}`}
              onClick={() => toggleArrayField('certifications', cert)}
            >
              {cert}
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q8_Certifications
