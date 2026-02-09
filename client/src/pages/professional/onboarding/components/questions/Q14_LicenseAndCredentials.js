import React, { useState } from 'react'
import QuestionContainer from '../QuestionContainer'

const Q14_LicenseAndCredentials = ({
  currentStep,
  profileData,
  updateField,
  saving,
  error,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const [credentialInput, setCredentialInput] = useState('')

  const handleContinue = async () => {
    await goToNextQuestion(currentStep)
  }

  const handleSkip = async () => {
    await goToNextQuestion(currentStep)
  }

  const handleAddCredential = () => {
    if (credentialInput.trim()) {
      const currentCredentials = profileData.credentials || []
      updateField('credentials', [...currentCredentials, credentialInput.trim()])
      setCredentialInput('')
    }
  }

  const handleRemoveCredential = (index) => {
    const currentCredentials = profileData.credentials || []
    updateField('credentials', currentCredentials.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCredential()
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
          What licenses or credentials do you hold?
          <span className="form-label-subtitle">
            Examples: LMFT, LPC, LCSW, PhD, PsyD, etc.
          </span>
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., LMFT License #12345"
            value={credentialInput}
            onChange={(e) => setCredentialInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            type="button"
            onClick={handleAddCredential}
            className="btn-continue"
            style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
          >
            Add
          </button>
        </div>

        {profileData.credentials && profileData.credentials.length > 0 && (
          <div className="chip-container" style={{ marginTop: '1rem' }}>
            {profileData.credentials.map((credential, index) => (
              <div key={index} className="chip selected">
                {credential}
                <i
                  className="fa fa-times"
                  onClick={() => handleRemoveCredential(index)}
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

export default Q14_LicenseAndCredentials
