import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { specialtyOptions } from '../../constants'

const Q9_Specialties = ({
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
          What topics do you specialize in?
          <span className="form-label-subtitle">
            Select all that apply - helps couples find the right fit
          </span>
        </label>
        <div className="chip-container">
          {specialtyOptions.map((specialty) => (
            <div
              key={specialty}
              className={`chip ${profileData.specialties?.includes(specialty) ? 'selected' : ''}`}
              onClick={() => toggleArrayField('specialties', specialty)}
            >
              {specialty}
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q9_Specialties
