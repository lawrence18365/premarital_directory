import React, { useState } from 'react'
import QuestionContainer from '../QuestionContainer'
import { normalizeAndValidateUrl } from '../../../../../lib/utils'

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
  const [websiteError, setWebsiteError] = useState('')

  const handleWebsiteBlur = () => {
    const raw = profileData.website
    if (!raw || !raw.trim()) {
      setWebsiteError('')
      return
    }
    const { url, error: urlError } = normalizeAndValidateUrl(raw)
    if (urlError) {
      setWebsiteError(urlError)
    } else {
      setWebsiteError('')
      updateField('website', url)
    }
  }

  const handleContinue = async () => {
    // Validation - require at least phone or website
    if (!profileData.phone?.trim() && !profileData.website?.trim()) {
      setError('Please provide at least a phone number or website so couples can reach you')
      return
    }

    // Validate website URL if provided
    if (profileData.website?.trim()) {
      const { url, error: urlError } = normalizeAndValidateUrl(profileData.website)
      if (urlError) {
        setWebsiteError(urlError)
        return
      }
      // Save normalized URL before continuing
      await goToNextQuestion(currentStep, { website: url })
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
          type="text"
          className="form-input"
          placeholder="https://www.yourpractice.com"
          value={profileData.website || ''}
          onChange={(e) => { updateField('website', e.target.value); setWebsiteError('') }}
          onBlur={handleWebsiteBlur}
        />
        {websiteError && (
          <div className="field-error" style={{ color: 'var(--error, #dc2626)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {websiteError}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--ds-accent-soft)', borderRadius: '8px', border: '1px solid var(--ds-border)' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate)' }}>
          <i className="fa fa-info-circle" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>
          <strong>Great progress!</strong> You've completed all the required information. The next questions are optional and help couples find you more easily.
        </p>
      </div>
    </QuestionContainer>
  )
}

export default Q6_ContactInfo
