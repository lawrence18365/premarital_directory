import React, { useState } from 'react'
import QuestionContainer from '../QuestionContainer'
import { CLERGY_PROFESSIONS } from '../../constants'

const getInitialSubStep = (profileData) => {
  if (!profileData.bio_approach?.trim()) return 0
  if (!profileData.bio_ideal_client?.trim()) return 1
  return 2
}

const getStepConfig = (isClergy) => {
  if (isClergy) {
    return [
      {
        title: 'Your Ministry Approach',
        label: 'How do you guide couples through marriage preparation?',
        field: 'bio_approach',
        placeholder: '2-3 sentences about your approach — e.g., the sessions you offer, the faith tradition you draw from, and what makes your preparation meaningful.'
      },
      {
        title: 'Couples You Serve',
        label: 'Who are you a great fit for?',
        field: 'bio_ideal_client',
        placeholder: 'Describe the couples you work with best — e.g., couples within your congregation, interfaith couples, couples of any background seeking faith-grounded preparation.'
      },
      {
        title: 'What Couples Receive',
        label: 'What can couples expect after working with you?',
        field: 'bio_outcomes',
        placeholder: 'Describe what couples walk away with — e.g., a deeper foundation of shared values, clarity on communication, a meaningful pre-wedding ritual or blessing.'
      }
    ]
  }

  return [
    {
      title: 'Your Approach',
      label: 'How do you work with couples?',
      field: 'bio_approach',
      placeholder: '2-3 sentences about your approach.'
    },
    {
      title: 'Best-Fit Couples',
      label: 'Who are you a great fit for?',
      field: 'bio_ideal_client',
      placeholder: 'Describe the couples you work with best.'
    },
    {
      title: 'Expected Outcomes',
      label: 'What can couples expect after working with you?',
      field: 'bio_outcomes',
      placeholder: 'Describe the transformation or results.'
    }
  ]
}

const Q5_Bio = ({
  currentStep,
  profileData,
  updateField,
  saveProgress,
  saving,
  error,
  setError,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const isClergy = CLERGY_PROFESSIONS.includes(profileData.profession)
  const stepConfig = getStepConfig(isClergy)
  const [subStep, setSubStep] = useState(() => getInitialSubStep(profileData))

  const activeStep = stepConfig[subStep]
  const isFinalSubStep = subStep === stepConfig.length - 1

  const handleContinue = async () => {
    const fieldValue = profileData[activeStep.field]?.trim()

    if (!fieldValue) {
      setError(`Please complete "${activeStep.label}"`)
      return
    }

    if (!isFinalSubStep) {
      const saveResult = await saveProgress(currentStep, {
        [activeStep.field]: profileData[activeStep.field]
      })

      if (!saveResult?.success) return

      setError('')
      setSubStep(prev => prev + 1)
      return
    }

    const combinedBio = `${profileData.bio_approach}\n\n${profileData.bio_ideal_client}\n\n${profileData.bio_outcomes}`
    await goToNextQuestion(currentStep, { bio: combinedBio })
  }

  const handleBack = () => {
    if (subStep > 0) {
      setError('')
      setSubStep(prev => prev - 1)
      return
    }

    goToPreviousQuestion()
  }

  return (
    <QuestionContainer
      currentStep={currentStep}
      saving={saving}
      error={error}
      onBack={handleBack}
      onContinue={handleContinue}
      titleOverride={activeStep.title}
      hideKicker={true}
      hideContext={true}
      continueLabelOverride={isFinalSubStep ? 'Continue' : 'Next'}
    >
      <div className="form-group">
        <label className="form-label">{activeStep.label}</label>
        <textarea
          className="form-textarea"
          style={{ minHeight: '100px' }}
          placeholder={activeStep.placeholder}
          value={profileData[activeStep.field] || ''}
          onChange={(e) => updateField(activeStep.field, e.target.value)}
          autoFocus
        />
      </div>
    </QuestionContainer>
  )
}

export default Q5_Bio
