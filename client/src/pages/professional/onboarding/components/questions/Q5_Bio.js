import React from 'react'
import QuestionContainer from '../QuestionContainer'

const Q5_Bio = ({
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
    if (!profileData.bio?.trim()) {
      setError('Please write a short bio')
      return
    }
    if (profileData.bio.trim().length < 50) {
      setError('Please write at least a few sentences (50 characters minimum)')
      return
    }

    // Save and navigate
    await goToNextQuestion(currentStep)
  }

  const charCount = profileData.bio?.length || 0
  const minChars = 50

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
          Tell couples about yourself
          <span className="form-label-subtitle">
            Share your approach, experience, and what makes your practice unique. This helps couples feel confident choosing you.
          </span>
        </label>
        <textarea
          className="form-textarea"
          placeholder="Example: I'm a licensed marriage and family therapist with 10 years of experience helping engaged couples build strong foundations. I use the Gottman Method and PREPARE/ENRICH assessments to help couples develop communication skills, navigate conflict, and align their values before marriage..."
          value={profileData.bio || ''}
          onChange={(e) => updateField('bio', e.target.value)}
          autoFocus
        />
        <div className="char-count">
          {charCount} / {minChars} characters minimum
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q5_Bio
