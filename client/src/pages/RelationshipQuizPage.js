import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import ShareButton from '../components/common/ShareButton'
import '../assets/css/share-button.css'

const QUESTIONS = [
  {
    category: 'Communication',
    question: 'When we disagree, we can talk it through without shutting down or escalating.',
    icon: 'fa-comments'
  },
  {
    category: 'Communication',
    question: 'I feel comfortable bringing up difficult topics with my partner.',
    icon: 'fa-comments'
  },
  {
    category: 'Finances',
    question: 'We have discussed our financial goals, debts, and spending habits openly.',
    icon: 'fa-wallet'
  },
  {
    category: 'Finances',
    question: 'We agree on how to handle money as a couple (joint accounts, budgeting, saving).',
    icon: 'fa-wallet'
  },
  {
    category: 'Conflict',
    question: 'After an argument, we usually repair and reconnect within a reasonable time.',
    icon: 'fa-handshake'
  },
  {
    category: 'Conflict',
    question: 'Neither of us uses contempt, criticism, or stonewalling during disagreements.',
    icon: 'fa-handshake'
  },
  {
    category: 'Expectations',
    question: 'We have talked about expectations around roles, household responsibilities, and careers.',
    icon: 'fa-home'
  },
  {
    category: 'Expectations',
    question: 'We agree on whether and when to have children, and how we would raise them.',
    icon: 'fa-home'
  },
  {
    category: 'Intimacy',
    question: 'We are both satisfied with our emotional and physical closeness.',
    icon: 'fa-heart'
  },
  {
    category: 'Intimacy',
    question: 'We regularly express appreciation and affection toward each other.',
    icon: 'fa-heart'
  }
]

const SCALE_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' }
]

const getCategoryScores = (answers) => {
  const categories = {}
  QUESTIONS.forEach((q, i) => {
    if (!categories[q.category]) categories[q.category] = []
    if (answers[i] != null) categories[q.category].push(answers[i])
  })

  return Object.entries(categories).map(([name, scores]) => ({
    name,
    score: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / (scores.length * 5)) * 100) : 0,
    icon: QUESTIONS.find(q => q.category === name)?.icon || 'fa-circle'
  }))
}

const getOverallScore = (answers) => {
  const vals = Object.values(answers).filter(v => v != null)
  if (vals.length === 0) return 0
  return Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 5)) * 100)
}

const getScoreLabel = (score) => {
  if (score >= 85) return { label: 'Strong Foundation', color: '#166534', bg: '#f0fdf4', border: '#86efac' }
  if (score >= 70) return { label: 'Good Start', color: '#854d0e', bg: '#fefce8', border: '#fde047' }
  if (score >= 50) return { label: 'Room to Grow', color: '#9a3412', bg: '#fff7ed', border: '#fdba74' }
  return { label: 'Worth Investing In', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5' }
}

const getWeakestArea = (categoryScores) => {
  if (categoryScores.length === 0) return null
  return categoryScores.reduce((min, cat) => cat.score < min.score ? cat : min)
}

const getShareText = (score) => {
  return `We scored ${score}% on the Relationship Readiness Quiz! How ready are you for marriage?`
}

const quizStructuredData = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": "Are You Ready? Relationship Readiness Quiz",
  "description": "A 10-question self-assessment for engaged couples to evaluate communication, finances, conflict resolution, expectations, and intimacy.",
  "educationalLevel": "beginner",
  "about": {
    "@type": "Thing",
    "name": "Premarital Counseling"
  }
}

const RelationshipQuizPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestion]: value }
    setAnswers(newAnswers)

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 200)
    } else {
      setTimeout(() => setShowResults(true), 300)
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleRestart = () => {
    setAnswers({})
    setCurrentQuestion(0)
    setShowResults(false)
    setEmailSubmitted(false)
  }

  const progress = (Object.keys(answers).length / QUESTIONS.length) * 100

  if (showResults) {
    const overallScore = getOverallScore(answers)
    const categoryScores = getCategoryScores(answers)
    const scoreInfo = getScoreLabel(overallScore)
    const weakest = getWeakestArea(categoryScores)
    const shareText = getShareText(overallScore)

    return (
      <div className="quiz-page">
        <SEOHelmet
          title="Your Results — Relationship Readiness Quiz"
          description={`You scored ${overallScore}% on the Relationship Readiness Quiz for engaged couples.`}
          url="/quiz/relationship-readiness"
          noindex={true}
        />

        <div className="quiz-container">
          <div className="quiz-results">
            {/* Score Circle */}
            <div className="quiz-score-hero" style={{ background: scoreInfo.bg, border: `2px solid ${scoreInfo.border}`, borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                border: `4px solid ${scoreInfo.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', flexDirection: 'column'
              }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, color: scoreInfo.color, lineHeight: 1 }}>{overallScore}</span>
                <span style={{ fontSize: '0.75rem', color: scoreInfo.color, fontWeight: 500 }}>out of 100</span>
              </div>
              <h1 style={{ fontSize: '1.5rem', color: scoreInfo.color, margin: '0 0 8px 0' }}>{scoreInfo.label}</h1>
              <p style={{ color: scoreInfo.color, opacity: 0.85, margin: 0, fontSize: '0.95rem' }}>
                {overallScore >= 85
                  ? 'You and your partner have a strong foundation. Premarital counseling can help you maintain it.'
                  : overallScore >= 70
                    ? 'You\'re in a good place. A few conversations with a counselor could strengthen your weak spots.'
                    : overallScore >= 50
                      ? 'There are important areas to work on. A counselor can help you build the skills you need.'
                      : 'Investing in your relationship now will pay dividends for decades. A counselor can help.'}
              </p>
            </div>

            {/* Category Breakdown */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Your Scores by Category</h2>
              {categoryScores.map(cat => (
                <div key={cat.name} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                      <i className={`fa ${cat.icon}`} aria-hidden="true" style={{ marginRight: '6px', color: 'var(--color-primary, #0d9488)' }}></i>
                      {cat.name}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{cat.score}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${cat.score}%`,
                      background: cat.score >= 80 ? '#22c55e' : cat.score >= 60 ? '#eab308' : '#ef4444',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Share */}
            <div style={{
              background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px',
              padding: '20px', textAlign: 'center', marginBottom: '24px'
            }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 8px 0' }}>
                How did your friends score?
              </p>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 12px 0' }}>
                Challenge other engaged couples to take the quiz.
              </p>
              <ShareButton
                url="/quiz/relationship-readiness"
                title="Relationship Readiness Quiz"
                text={shareText}
                variant="pill"
              />
            </div>

            {/* CTA: Find a Counselor */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(13,148,136,0.04) 100%)',
              border: '1px solid rgba(13,148,136,0.2)',
              borderRadius: '12px', padding: '24px', textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>
                {weakest ? `Strengthen Your ${weakest.name} Skills` : 'Build an Even Stronger Foundation'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: '0 0 16px 0' }}>
                {weakest
                  ? `Your ${weakest.name.toLowerCase()} score was ${weakest.score}%. A premarital counselor can help you develop this area before your wedding.`
                  : 'A premarital counselor can help you build on your strengths and prepare for marriage.'}
              </p>
              <Link
                to="/premarital-counseling"
                className="btn btn-primary"
                style={{ fontSize: '0.9rem' }}
              >
                Find a Counselor Near You
              </Link>
            </div>

            <button
              onClick={handleRestart}
              style={{
                display: 'block', margin: '24px auto 0', background: 'none',
                border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  const q = QUESTIONS[currentQuestion]

  return (
    <div className="quiz-page">
      <SEOHelmet
        title="Are You Ready? Relationship Readiness Quiz for Engaged Couples"
        description="Take this free 2-minute quiz to assess your relationship readiness across communication, finances, conflict, expectations, and intimacy. Get personalized results."
        url="/quiz/relationship-readiness"
        structuredData={quizStructuredData}
        keywords="relationship readiness quiz, premarital quiz, are you ready for marriage quiz, engaged couple quiz, marriage preparation assessment"
      />

      <div className="quiz-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Question {currentQuestion + 1} of {QUESTIONS.length}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--color-primary, #0d9488)',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Question */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <i className={`fa ${q.icon}`} aria-hidden="true" style={{ color: 'var(--color-primary, #0d9488)', fontSize: '0.9rem' }}></i>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary, #0d9488)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {q.category}
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
            {q.question}
          </h2>
        </div>

        {/* Answer Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {SCALE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                border: answers[currentQuestion] === opt.value
                  ? '2px solid var(--color-primary, #0d9488)'
                  : '2px solid #e5e7eb',
                borderRadius: '10px',
                background: answers[currentQuestion] === opt.value
                  ? 'rgba(13,148,136,0.06)'
                  : '#fff',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: answers[currentQuestion] === opt.value ? 600 : 400,
                color: '#1f2937',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit'
              }}
            >
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                border: answers[currentQuestion] === opt.value
                  ? '2px solid var(--color-primary, #0d9488)'
                  : '2px solid #d1d5db',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                background: answers[currentQuestion] === opt.value ? 'var(--color-primary, #0d9488)' : 'transparent'
              }}>
                {answers[currentQuestion] === opt.value && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                )}
              </span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={handleBack}
            disabled={currentQuestion === 0}
            style={{
              padding: '8px 16px', border: 'none', background: 'none',
              color: currentQuestion === 0 ? '#d1d5db' : '#6b7280',
              cursor: currentQuestion === 0 ? 'default' : 'pointer',
              fontSize: '0.85rem', fontFamily: 'inherit'
            }}
          >
            <i className="fa fa-arrow-left" aria-hidden="true" style={{ marginRight: '6px' }}></i>
            Back
          </button>
          {answers[currentQuestion] != null && currentQuestion < QUESTIONS.length - 1 && (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              style={{
                padding: '8px 16px', border: 'none',
                background: 'var(--color-primary, #0d9488)', color: '#fff',
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
                fontFamily: 'inherit', fontWeight: 500
              }}
            >
              Next
              <i className="fa fa-arrow-right" aria-hidden="true" style={{ marginLeft: '6px' }}></i>
            </button>
          )}
          {answers[currentQuestion] != null && currentQuestion === QUESTIONS.length - 1 && (
            <button
              onClick={() => setShowResults(true)}
              style={{
                padding: '10px 20px', border: 'none',
                background: 'var(--color-primary, #0d9488)', color: '#fff',
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
                fontFamily: 'inherit', fontWeight: 600
              }}
            >
              See Results
            </button>
          )}
        </div>

        {/* Footer */}
        <p style={{ marginTop: '40px', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }}>
          This quiz is for educational purposes only and is not a clinical assessment.
          For personalized guidance,{' '}
          <Link to="/premarital-counseling" style={{ color: 'var(--color-primary, #0d9488)' }}>
            find a counselor near you
          </Link>.
        </p>
      </div>
    </div>
  )
}

export default RelationshipQuizPage
