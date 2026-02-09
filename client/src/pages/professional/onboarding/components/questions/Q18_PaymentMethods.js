import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { paymentMethodOptions } from '../../constants'

const Q18_PaymentMethods = ({
  currentStep,
  profileData,
  toggleArrayField,
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
          What payment methods do you accept?
          <span className="form-label-subtitle">
            Select all that apply
          </span>
        </label>
        <div className="chip-container">
          {paymentMethodOptions.map((method) => (
            <div
              key={method}
              className={`chip ${profileData.payment_methods?.includes(method) ? 'selected' : ''}`}
              onClick={() => toggleArrayField('payment_methods', method)}
            >
              {method}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate)' }}>
          <i className="fa fa-info-circle" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>
          <strong>Almost done!</strong> Just a couple more optional questions to help couples find you, then you'll review and publish.
        </p>
      </div>
    </QuestionContainer>
  )
}

export default Q18_PaymentMethods
