import React from 'react'
import QuestionContainer from '../QuestionContainer'

const Q5_Bio = ({
  currentStep,
  profileData,
  updateField,
  saving,
  error,
  setError,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const handleContinue = async () => {
    // Validation - check all three fields
    if (!profileData.bio_approach?.trim()) {
      setError('Please describe your approach')
      return
    }
    if (!profileData.bio_ideal_client?.trim()) {
      setError('Please describe who you\'re a great fit for')
      return
    }
    if (!profileData.bio_outcomes?.trim()) {
      setError('Please describe what couples can expect')
      return
    }

    // Combine into main bio field for backward compatibility
    const combinedBio = `${profileData.bio_approach}\n\n${profileData.bio_ideal_client}\n\n${profileData.bio_outcomes}`
    updateField('bio', combinedBio)

    // Save and navigate
    await goToNextQuestion(currentStep)
  }

  return (
    <QuestionContainer
      currentStep={currentStep}
      saving={saving}
      error={error}
      onBack={goToPreviousQuestion}
      onContinue={handleContinue}
    >
      <div className="form-group">
        <label className="form-label">
          Your approach in 2-3 sentences
          <span className="form-label-subtitle">
            This appears at the top of your profile and in search results
          </span>
        </label>
        <textarea
          className="form-textarea"
          style={{ minHeight: '100px' }}
          placeholder="Example: I use the Gottman Method and PREPARE/ENRICH assessments to help couples build communication skills, navigate conflict, and align their values before marriage. My sessions are practical, collaborative, and focused on giving you tools you'll use for life."
          value={profileData.bio_approach || ''}
          onChange={(e) => updateField('bio_approach', e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Who you're a great fit for
          <span className="form-label-subtitle">
            Help the right couples find you
          </span>
        </label>
        <textarea
          className="form-textarea"
          style={{ minHeight: '100px' }}
          placeholder="Example: You're planning to marry within the next 6-12 months and want to enter marriage with your eyes wide open. You value communication, are willing to do the work, and want practical tools—not just theory. I work especially well with couples navigating interfaith or intercultural backgrounds."
          value={profileData.bio_ideal_client || ''}
          onChange={(e) => updateField('bio_ideal_client', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          What couples can expect after working with you
          <span className="form-label-subtitle">
            Paint a picture of the transformation
          </span>
        </label>
        <textarea
          className="form-textarea"
          style={{ minHeight: '100px' }}
          placeholder="Example: You'll have a toolkit for handling conflict constructively, a shared vision for your future together, and confidence in your relationship foundation. Most couples say they wish they'd done this sooner—it's like getting a roadmap before a big journey."
          value={profileData.bio_outcomes || ''}
          onChange={(e) => updateField('bio_outcomes', e.target.value)}
        />
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.9rem' }}>
        <strong style={{ color: 'var(--primary)' }}>💡 Pro tip:</strong> Be specific! Generic phrases like "I help couples communicate better" don't stand out. Share what makes YOU different.
      </div>
    </QuestionContainer>
  )
}

export default Q5_Bio
