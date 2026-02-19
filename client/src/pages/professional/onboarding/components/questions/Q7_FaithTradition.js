import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { faithTraditionOptions, CLERGY_PROFESSIONS } from '../../constants'

const Q7_FaithTradition = ({
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
    await goToNextQuestion(currentStep, { faith_tradition: '' })
  }

  return (
    <QuestionContainer
      currentStep={currentStep}
      saving={saving}
      error={error}
      onBack={goToPreviousQuestion}
      onContinue={handleContinue}
      onSkip={isClergy ? undefined : handleSkip}
      canSkip={!isClergy}
    >
      <div className="form-group">
        <label className="form-label">
          {isClergy ? 'What faith tradition do you represent?' : "What's your faith tradition?"}
          <span className="form-label-subtitle">
            {isClergy
              ? 'Couples searching for faith-based preparation will filter by this'
              : 'This helps couples find counselors who align with their beliefs'}
          </span>
        </label>
        <div className="radio-group">
          {faithTraditionOptions.map((option) => (
            <div
              key={option.value}
              className={`radio-option ${profileData.faith_tradition === option.value ? 'selected' : ''}`}
              onClick={() => updateField('faith_tradition', option.value)}
            >
              <input
                type="radio"
                name="faith_tradition"
                value={option.value}
                checked={profileData.faith_tradition === option.value}
                onChange={() => updateField('faith_tradition', option.value)}
              />
              <span className="radio-option-label">{option.label}</span>
            </div>
          ))}
        </div>
        {isClergy && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--slate)' }}>
            <i className="fa fa-info-circle" style={{ marginRight: '0.4rem', color: 'var(--primary)' }}></i>
            Couples can filter the directory by faith tradition — selecting yours helps them find you.
          </p>
        )}
      </div>
    </QuestionContainer>
  )
}

export default Q7_FaithTradition
