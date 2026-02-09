import React from 'react'
import QuestionContainer from '../QuestionContainer'

const Q6_ContactInfo = ({
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
    // Validation - require at least phone or website
    if (!profileData.phone?.trim() && !profileData.website?.trim()) {
      setError('Please provide at least a phone number or website so couples can reach you')
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
          How can couples contact you?
          <span className="form-label-subtitle">
            Provide at least one way for couples to get in touch
          </span>
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">
          Phone number
        </label>
        <input
          type="tel"
          className="form-input"
          placeholder="(555) 123-4567"
          value={profileData.phone || ''}
          onChange={(e) => updateField('phone', e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Website
        </label>
        <input
          type="url"
          className="form-input"
          placeholder="https://www.yourpractice.com"
          value={profileData.website || ''}
          onChange={(e) => updateField('website', e.target.value)}
        />
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate)' }}>
          <i className="fa fa-info-circle" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>
          <strong>Great progress!</strong> You've completed all the required information. The next questions are optional and help couples find you more easily.
        </p>
      </div>
    </QuestionContainer>
  )
}

export default Q6_ContactInfo
