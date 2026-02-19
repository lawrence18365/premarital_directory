import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { insuranceOptions, CLERGY_PROFESSIONS } from '../../constants'

const Q17_Insurance = ({
  currentStep,
  profileData,
  toggleArrayField,
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

  if (isClergy) {
    return (
      <QuestionContainer
        currentStep={currentStep}
        saving={saving}
        error={error}
        onBack={goToPreviousQuestion}
        onContinue={handleContinue}
        continueLabelOverride="Continue"
      >
        <div className="form-group">
          <label className="form-label">
            Insurance
            <span className="form-label-subtitle">
              Faith-based marriage preparation is not typically billed through insurance
            </span>
          </label>
          <div style={{ padding: '1.25rem', background: 'var(--ds-accent-soft)', borderRadius: '8px', border: '1px solid var(--ds-border)' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--slate)', lineHeight: '1.6' }}>
              <i className="fa fa-info-circle" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>
              Insurance companies don't reimburse clergy or faith-based marriage preparation — this step doesn't apply to you.
              Click <strong>Continue</strong> to move on.
            </p>
          </div>
        </div>
      </QuestionContainer>
    )
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
          Do you accept insurance?
          <span className="form-label-subtitle">
            Select all insurance providers you accept
          </span>
        </label>
        <div className="chip-container">
          {insuranceOptions.map((insurance) => (
            <div
              key={insurance}
              className={`chip ${profileData.insurance_accepted?.includes(insurance) ? 'selected' : ''}`}
              onClick={() => toggleArrayField('insurance_accepted', insurance)}
            >
              {insurance}
            </div>
          ))}
        </div>
      </div>
    </QuestionContainer>
  )
}

export default Q17_Insurance
