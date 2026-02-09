import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { treatmentApproachOptions } from '../../constants'

const Q10_TherapeuticApproach = ({
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
          What therapeutic approaches or programs do you use?
          <span className="form-label-subtitle">
            Select all that apply
          </span>
        </label>
        <div className="chip-container">
          {treatmentApproachOptions.map((approach) => (
            <div
              key={approach}
              className={`chip ${profileData.treatment_approaches?.includes(approach) ? 'selected' : ''}`}
              onClick={() => toggleArrayField('treatment_approaches', approach)}
            >
              {approach}
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q10_TherapeuticApproach
