import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { CLERGY_PROFESSIONS } from '../../constants'

const Q16_SessionFees = ({
  currentStep,
  profileData,
  updateField,
  saving,
  error,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const isClergy = CLERGY_PROFESSIONS.includes(profileData.profession)

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
      {isClergy && (
        <div className="form-group">
          <div
            className={`checkbox-container ${profileData.donation_based ? 'checked' : ''}`}
            onClick={() => {
              const next = !profileData.donation_based
              updateField('donation_based', next)
              if (next) {
                updateField('session_fee_min', '')
                updateField('session_fee_max', '')
                updateField('sliding_scale', false)
              }
            }}
          >
            <input
              type="checkbox"
              checked={profileData.donation_based || false}
              readOnly
            />
            <label className="checkbox-label">
              I offer this service free of charge or donation-based
            </label>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--slate)', marginLeft: '1.75rem' }}>
            Many clergy provide marriage preparation as part of their ministry — check this if no set fee applies.
          </p>
        </div>
      )}

      {!profileData.donation_based && (
        <>
          <div className="form-group">
            <label className="form-label">
              {isClergy ? 'Do you charge a fee for marriage preparation?' : 'What are your session fees?'}
              <span className="form-label-subtitle">
                {isClergy ? 'Leave blank if donation-based or included in parish/congregation services' : 'Couples appreciate knowing pricing upfront'}
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
                readOnly
              />
              <label className="checkbox-label">
                I offer a free initial consultation
              </label>
            </div>
          </div>

          {!isClergy && (
            <div className="form-group">
              <div
                className={`checkbox-container ${profileData.sliding_scale ? 'checked' : ''}`}
                onClick={() => updateField('sliding_scale', !profileData.sliding_scale)}
              >
                <input
                  type="checkbox"
                  checked={profileData.sliding_scale || false}
                  readOnly
                />
                <label className="checkbox-label">
                  I offer sliding scale fees based on income
                </label>
              </div>
            </div>
          )}
        </>
      )}
    </QuestionContainer>
  )
}

export default Q16_SessionFees
