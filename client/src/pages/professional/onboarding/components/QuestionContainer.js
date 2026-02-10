import React from 'react'
import { QUESTION_METADATA, TOTAL_QUESTIONS } from '../constants'

const QuestionContainer = ({
  currentStep,
  saving,
  error,
  onBack,
  onContinue,
  onSkip,
  children,
  canSkip = false,
  continueDisabled = false,
  titleOverride = '',
  continueLabelOverride = ''
}) => {
  const questionInfo = QUESTION_METADATA[currentStep]
  const isFirstQuestion = currentStep === 1
  const isLastQuestion = currentStep === TOTAL_QUESTIONS

  const resolvedTitle = titleOverride || questionInfo?.title

  return (
    <div className="onboarding-container">
      <div className="question-content">
        <div className="question-header">
          <div className="question-heading-block">
            <h2 className="question-title">{resolvedTitle}</h2>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <i className="fa fa-exclamation-circle"></i> {error}
          </div>
        )}

        <div className="question-body">
          {children}
        </div>

        <div className="question-nav">
          {!isFirstQuestion && (
            <button
              type="button"
              onClick={onBack}
              className="btn-back"
              disabled={saving}
            >
              <i className="fa fa-arrow-left"></i> Back
            </button>
          )}

          <div className="nav-right">
            {canSkip && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="btn-skip"
                disabled={saving}
              >
                Skip
              </button>
            )}

            <button
              type="button"
              onClick={onContinue}
              className="btn-continue"
              disabled={saving || continueDisabled}
            >
              {saving ? (
                <>
                  <i className="fa fa-circle-o-notch fa-spin"></i> Saving...
                </>
              ) : isLastQuestion ? (
                <>
                  <i className="fa fa-check"></i> Publish Profile
                </>
              ) : (
                <>
                  {continueLabelOverride || 'Next Question'} <i className="fa fa-arrow-right"></i>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionContainer
