import React, { useCallback, useEffect } from 'react'
import { QUESTION_METADATA, TOTAL_QUESTIONS } from '../constants'

const SECONDS_PER_STEP = 20

const STEP_SECTIONS = [
  { name: 'Your Info', start: 1, end: 3 },
  { name: 'Your Practice', start: 4, end: 6 },
  { name: 'Publish', start: 7, end: 7 }
]

const getSectionForStep = (step) => {
  return STEP_SECTIONS.find(s => step >= s.start && step <= s.end) || STEP_SECTIONS[0]
}

const getTimeEstimate = (stepsRemaining) => {
  const totalSeconds = stepsRemaining * SECONDS_PER_STEP
  const minutes = Math.ceil(totalSeconds / 60)
  if (minutes <= 1) return '< 1 min left'
  return `~${minutes} min left`
}

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
  const progress = Math.round((currentStep / TOTAL_QUESTIONS) * 100)
  const stepsRemaining = TOTAL_QUESTIONS - currentStep

  const resolvedTitle = titleOverride || questionInfo?.title
  const section = getSectionForStep(currentStep)

  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Enter') return
    // Don't trigger on textareas (they need Enter for newlines)
    if (e.target.tagName === 'TEXTAREA') return
    if (saving || continueDisabled) return

    e.preventDefault()
    onContinue()
  }, [saving, continueDisabled, onContinue])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="onboarding-container">
      <div className="onboarding-progress">
        <div className="progress-info">
          <div className="progress-info-left">
            <span className="progress-kicker">{section.name}</span>
            <span className="progress-text">Step {currentStep} of {TOTAL_QUESTIONS}</span>
          </div>
          <div className="progress-info-right">
            <span className="progress-percent">{progress}%</span>
            {!isLastQuestion && (
              <span className="progress-eta">{getTimeEstimate(stepsRemaining)}</span>
            )}
          </div>
        </div>

        <div className="progress-step-dots" aria-hidden="true">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, index) => {
            const stepNumber = index + 1
            const dotClass = stepNumber < currentStep
              ? 'is-complete'
              : stepNumber === currentStep
                ? 'is-current'
                : ''
            return <span key={stepNumber} className={`progress-step-dot ${dotClass}`} />
          })}
        </div>

        {saving && (
          <span className="saving-indicator">
            <i className="fa fa-circle-o-notch fa-spin"></i> Saving...
          </span>
        )}
      </div>

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
