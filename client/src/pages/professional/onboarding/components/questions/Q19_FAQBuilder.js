import React, { useState } from 'react'
import QuestionContainer from '../QuestionContainer'

const commonFAQs = [
  {
    id: 'online_sessions',
    question: 'Do you offer online sessions?',
    placeholder: 'Example: Yes, I offer sessions via Zoom for couples anywhere in [state/province]. Online sessions work just as well as in-person.'
  },
  {
    id: 'how_many_sessions',
    question: 'How many sessions do couples typically need?',
    placeholder: 'Example: Most couples complete 6-8 sessions over 2-3 months. We can customize based on your timeline and needs.'
  },
  {
    id: 'before_wedding',
    question: 'How far in advance of the wedding should we start?',
    placeholder: 'Example: Ideally 3-6 months before your wedding. This gives us time to work through topics without rushing, but I can accommodate shorter timelines.'
  },
  {
    id: 'faith_requirement',
    question: 'Do we need to share your faith tradition?',
    placeholder: 'Example: Not at all—I work with couples of all backgrounds. I integrate faith if it\'s important to you, but it\'s not required.'
  },
  {
    id: 'interfaith_couples',
    question: 'Do you work with interfaith or intercultural couples?',
    placeholder: 'Example: Absolutely! I specialize in helping couples navigate different backgrounds and find common ground.'
  },
  {
    id: 'lgbtq_affirming',
    question: 'Are you LGBTQ+ affirming?',
    placeholder: 'Example: Yes, I welcome and affirm all couples regardless of gender identity or sexual orientation.'
  },
  {
    id: 'what_to_expect',
    question: 'What happens in the first session?',
    placeholder: 'Example: We\'ll discuss your relationship history, current strengths, and areas you want to work on. I\'ll explain my approach and answer any questions.'
  },
  {
    id: 'assessments',
    question: 'Do you use relationship assessments?',
    placeholder: 'Example: Yes, I use the PREPARE/ENRICH assessment. It identifies your strengths and growth areas, and provides great discussion topics.'
  },
  {
    id: 'insurance',
    question: 'Do you accept insurance or provide receipts?',
    placeholder: 'Example: I can provide receipts for many extended health plans. Check with your provider about mental health coverage.'
  },
  {
    id: 'cancellation',
    question: 'What\'s your cancellation policy?',
    placeholder: 'Example: I require 48 hours notice to cancel or reschedule. Last-minute cancellations may be charged at 50% of the session fee.'
  },
  {
    id: 'confidentiality',
    question: 'Is everything we discuss confidential?',
    placeholder: 'Example: Yes, everything is confidential unless there\'s risk of harm. I won\'t share information with family, friends, or clergy without your permission.'
  },
  {
    id: 'format',
    question: 'Do you meet with us together or separately?',
    placeholder: 'Example: Almost always together as a couple. Occasionally I might meet with you individually if it helps address a specific issue.'
  }
]

const Q19_FAQBuilder = ({
  currentStep,
  profileData,
  saving,
  error,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  // Initialize selected FAQs from profileData
  const [selectedFAQs, setSelectedFAQs] = useState(() => {
    if (profileData.faqs && Array.isArray(profileData.faqs)) {
      return profileData.faqs.map(faq => faq.id)
    }
    return []
  })

  const [faqAnswers, setFaqAnswers] = useState(() => {
    if (profileData.faqs && Array.isArray(profileData.faqs)) {
      const answers = {}
      profileData.faqs.forEach(faq => {
        answers[faq.id] = faq.answer
      })
      return answers
    }
    return {}
  })

  const handleToggleFAQ = (faqId) => {
    const isCurrentlySelected = selectedFAQs.includes(faqId)

    if (isCurrentlySelected) {
      setSelectedFAQs(prev => prev.filter(id => id !== faqId))
      setFaqAnswers(prev => {
        const newAnswers = { ...prev }
        delete newAnswers[faqId]
        return newAnswers
      })
    } else {
      setSelectedFAQs(prev => [...prev, faqId])
    }
  }

  const handleAnswerChange = (faqId, answer) => {
    setFaqAnswers(prev => ({
      ...prev,
      [faqId]: answer
    }))
  }

  const handleContinue = async () => {
    // Build FAQs array
    const faqs = selectedFAQs.map(faqId => {
      const faqData = commonFAQs.find(f => f.id === faqId)
      return {
        id: faqId,
        question: faqData.question,
        answer: faqAnswers[faqId] || ''
      }
    }).filter(faq => faq.answer.trim()) // Only include FAQs with answers

    // Save and navigate
    await goToNextQuestion(currentStep, { faqs })
  }

  const handleSkip = async () => {
    await goToNextQuestion(currentStep, { faqs: [] })
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
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '1rem', color: 'var(--slate)', margin: 0 }}>
          <strong>Help couples find you in search!</strong> Answer common questions to create unique content for your profile.
          Select the questions that apply to you, then write your answers.
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">
          Select questions to answer (optional, but recommended)
        </label>

        {commonFAQs.map((faq) => {
          const isSelected = selectedFAQs.includes(faq.id)

          return (
            <div key={faq.id} style={{ marginBottom: '1.5rem' }}>
              <div
                className={`checkbox-container ${isSelected ? 'checked' : ''}`}
                onClick={() => handleToggleFAQ(faq.id)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                />
                <label className="checkbox-label">
                  {faq.question}
                </label>
              </div>

              {isSelected && (
                <div style={{ marginTop: '0.5rem', marginLeft: '2rem' }}>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '80px' }}
                    placeholder={faq.placeholder}
                    value={faqAnswers[faq.id] || ''}
                    onChange={(e) => handleAnswerChange(faq.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--ds-accent-soft)', borderRadius: '8px', border: '1px solid var(--ds-border)' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ds-ink-muted)' }}>
          <i className="fa fa-lightbulb-o" style={{ marginRight: '0.5rem', color: 'var(--ds-accent)' }}></i>
          <strong>SEO Tip:</strong> These answers appear on your profile and help you rank for searches like "online premarital counseling" or "interfaith marriage prep in [city]." The more specific, the better!
        </p>
      </div>
    </QuestionContainer>
  )
}

export default Q19_FAQBuilder
