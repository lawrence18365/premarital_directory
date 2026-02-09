import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { professionOptions } from '../../constants'

const Q1_NameAndProfession = ({
  currentStep,
  profileData,
  updateField,
  saving,
  error,
  setError,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const handleContinue = async () => {
    // Validation
    if (!profileData.full_name?.trim()) {
      setError('Please enter your full name')
      return
    }
    if (!profileData.profession) {
      setError('Please select your profession')
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
          What's your name?
          <span className="form-label-subtitle">
            This will appear on your profile (e.g., "Dr. Sarah Mitchell, LMFT")
          </span>
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="Your full name"
          value={profileData.full_name || ''}
          onChange={(e) => updateField('full_name', e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          What type of professional are you?
        </label>
        <div className="radio-group">
          {professionOptions.map((option) => (
            <div
              key={option.value}
              className={`radio-option ${profileData.profession === option.value ? 'selected' : ''}`}
              onClick={() => updateField('profession', option.value)}
            >
              <input
                type="radio"
                name="profession"
                value={option.value}
                checked={profileData.profession === option.value}
                onChange={() => updateField('profession', option.value)}
              />
              <span className="radio-option-label">{option.label}</span>
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q1_NameAndProfession
