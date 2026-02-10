import React, { useEffect, useState } from 'react'
import QuestionContainer from '../QuestionContainer'
import { professionOptions } from '../../constants'

const Q1_NameAndProfession = ({
  currentStep,
  profileData,
  updateField,
  saveProgress,
  saving,
  error,
  setError,
  goToNextQuestion
}) => {
  const [subStep, setSubStep] = useState(() => (
    profileData.full_name?.trim() ? 'profession' : 'name'
  ))

  useEffect(() => {
    if (!profileData.full_name?.trim()) {
      setSubStep('name')
    }
  }, [profileData.full_name])

  const handleContinue = async () => {
    if (subStep === 'name') {
      if (!profileData.full_name?.trim()) {
        setError('Please enter your full name')
        return
      }

      const saveResult = await saveProgress(currentStep, {
        full_name: profileData.full_name
      })

      if (!saveResult?.success) return

      setError('')
      setSubStep('profession')
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
      onContinue={handleContinue}
      titleOverride={subStep === 'name' ? 'Full Name' : 'Profession'}
      hideKicker={true}
      hideContext={true}
      continueLabelOverride={subStep === 'name' ? 'Next' : 'Continue'}
    >
      {subStep === 'name' ? (
        <div className="full-name-meta-box">
          <label className="form-label">
            Full name
          </label>

          <input
            type="text"
            className="form-input full-name-meta-input"
            placeholder="Full name"
            value={profileData.full_name || ''}
            onChange={(e) => updateField('full_name', e.target.value)}
            autoFocus
          />
        </div>
      ) : (
        <>
          <div className="full-name-meta-box full-name-meta-box--compact">
            <div className="full-name-meta-title">Full name</div>
            <div className="full-name-meta-value">{profileData.full_name}</div>

            <button
              type="button"
              className="full-name-meta-edit"
              onClick={() => setSubStep('name')}
            >
              Edit Name
            </button>
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
        </>
      )}
    </QuestionContainer>
  )
}

export default Q1_NameAndProfession
