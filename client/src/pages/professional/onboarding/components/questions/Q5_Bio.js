import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { CLERGY_PROFESSIONS } from '../../constants'

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
  const isClergy = CLERGY_PROFESSIONS.includes(profileData.profession)

  const handleContinue = async () => {
    const bio = profileData.bio?.trim()
    if (!bio) {
      setError('Please write a brief description so couples know what to expect')
      return
    }

    // Also save to structured fields for backward compatibility
    await goToNextQuestion(currentStep, {
      bio: bio,
      bio_approach: bio
    })
  }

  const placeholder = isClergy
    ? 'Tell couples about your marriage preparation ministry — your approach, who you typically work with, and what couples can expect. Even 2-3 sentences is great to start.\n\nExample: "I offer faith-centered marriage preparation grounded in Scripture and practical communication tools. I work with couples of all backgrounds who want a meaningful foundation for their marriage. Sessions typically cover communication, conflict resolution, finances, and spiritual life together."'
    : 'Tell couples about your practice — your approach, who you work best with, and what couples can expect. Even 2-3 sentences is great to start.\n\nExample: "I specialize in evidence-based premarital counseling using the Gottman Method. I work with engaged and newly married couples who want to build a strong foundation. My sessions focus on communication, conflict resolution, and building shared meaning."'

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
          {isClergy ? 'Tell couples about your ministry' : 'Tell couples about your practice'}
          <span className="form-label-subtitle">
            You can always expand this later from your dashboard
          </span>
        </label>
        <textarea
          className="form-textarea"
          style={{ minHeight: '160px' }}
          placeholder={placeholder}
          value={profileData.bio || ''}
          onChange={(e) => updateField('bio', e.target.value)}
          autoFocus
        />
      </div>
    </QuestionContainer>
  )
}

export default Q5_Bio
