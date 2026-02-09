import React, { useState } from 'react'
import QuestionContainer from '../QuestionContainer'

const Q15_Education = ({
  currentStep,
  profileData,
  updateField,
  saving,
  error,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const [educationInput, setEducationInput] = useState('')

  const handleContinue = async () => {
    await goToNextQuestion(currentStep)
  }

  const handleSkip = async () => {
    await goToNextQuestion(currentStep)
  }

  const handleAddEducation = () => {
    if (educationInput.trim()) {
      const currentEducation = profileData.education || []
      updateField('education', [...currentEducation, educationInput.trim()])
      setEducationInput('')
    }
  }

  const handleRemoveEducation = (index) => {
    const currentEducation = profileData.education || []
    updateField('education', currentEducation.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddEducation()
    }
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
          What's your educational background?
          <span className="form-label-subtitle">
            Examples: MA in Marriage & Family Therapy - University of Southern California
          </span>
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., MA in Counseling Psychology - Boston College"
            value={educationInput}
            onChange={(e) => setEducationInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            type="button"
            onClick={handleAddEducation}
            className="btn-continue"
            style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
          >
            Add
          </button>
        </div>

        {profileData.education && profileData.education.length > 0 && (
          <div className="chip-container" style={{ marginTop: '1rem' }}>
            {profileData.education.map((edu, index) => (
              <div key={index} className="chip selected">
                {edu}
                <i
                  className="fa fa-times"
                  onClick={() => handleRemoveEducation(index)}
                  style={{ marginLeft: '0.5rem', cursor: 'pointer' }}
                ></i>
              </div>
            ))}
          </div>
        )}
      </div>
    </QuestionContainer>
  )
}

export default Q15_Education
