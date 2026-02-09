import React from 'react'
import QuestionContainer from '../QuestionContainer'

const Q16_SessionFees = ({
  currentStep,
  profileData,
  updateField,
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
          What are your session fees?
          <span className="form-label-subtitle">
            Couples appreciate knowing pricing upfront
          </span>
        </label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              Minimum
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>$</span>
              <input
                type="number"
                className="form-input"
                placeholder="100"
                value={profileData.session_fee_min || ''}
                onChange={(e) => updateField('session_fee_min', e.target.value)}
                min="0"
                step="5"
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              Maximum
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>$</span>
              <input
                type="number"
                className="form-input"
                placeholder="200"
                value={profileData.session_fee_max || ''}
                onChange={(e) => updateField('session_fee_max', e.target.value)}
                min="0"
                step="5"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="form-group">
        <div
          className={`checkbox-container ${profileData.offers_free_consultation ? 'checked' : ''}`}
          onClick={() => updateField('offers_free_consultation', !profileData.offers_free_consultation)}
        >
          <input
            type="checkbox"
            checked={profileData.offers_free_consultation || false}
            onChange={() => updateField('offers_free_consultation', !profileData.offers_free_consultation)}
          />
          <label className="checkbox-label">
            I offer a free initial consultation
          </label>
        </div>
      </div>

      <div className="form-group">
        <div
          className={`checkbox-container ${profileData.sliding_scale ? 'checked' : ''}`}
          onClick={() => updateField('sliding_scale', !profileData.sliding_scale)}
        >
          <input
            type="checkbox"
            checked={profileData.sliding_scale || false}
            onChange={() => updateField('sliding_scale', !profileData.sliding_scale)}
          />
          <label className="checkbox-label">
            I offer sliding scale fees based on income
          </label>
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q16_SessionFees
