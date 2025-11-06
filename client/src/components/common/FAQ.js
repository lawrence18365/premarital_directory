import React, { useState } from 'react'
import SEOHelmet from '../analytics/SEOHelmet'

const FAQ = ({ 
  faqs = [], 
  title = "Frequently Asked Questions",
  description = null,
  showSearch = true,
  expandMultiple = false,
  className = '',
  showAside = true
}) => {
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  // Filter FAQs based on search term
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems)
    
    if (!expandMultiple) {
      newExpanded.clear()
    }
    
    if (expandedItems.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    
    setExpandedItems(newExpanded)
  }

  // Generate structured data for SEO (use the full list, not filtered)
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  if (faqs.length === 0) {
    return null
  }

  return (
    <>
      <SEOHelmet structuredData={faqStructuredData} />
      <section className={`faq-section ${className}`}>
        <div className="faq-container">
          <div className="faq-header">
            <h2 className="faq-title">{title}</h2>
            {description && (
              <p className="faq-description">{description}</p>
            )}
          </div>

          <div className="faq-controls">
            {showSearch && faqs.length > 5 && (
              <div className="faq-search">
                <div className="faq-search-input-container">
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="faq-search-input"
                    aria-label="Search frequently asked questions"
                  />
                  <i className="fas fa-search faq-search-icon"></i>
                </div>
              </div>
            )}
            <div className="faq-actions">
              <button
                type="button"
                className="faq-action"
                onClick={() => setExpandedItems(new Set(faqs.map((_, i) => i)))}
              >
                Expand all
              </button>
              <button
                type="button"
                className="faq-action"
                onClick={() => setExpandedItems(new Set())}
              >
                Collapse all
              </button>
            </div>
          </div>

          <div className="faq-grid">
            <div className="faq-list" role="list">
              {filteredFaqs.map((faq, index) => {
                const isExpanded = expandedItems.has(index)
                const qId = `faq-question-${index}`
                const aId = `faq-answer-${index}`
                const anchor = `#${qId}`
                
                const onKeyDown = (e) => {
                  const items = Array.from(document.querySelectorAll('.faq-question'))
                  const currentIndex = items.findIndex(el => el.id === qId)
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    const next = items[currentIndex + 1] || items[0]
                    next?.focus()
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    const prev = items[currentIndex - 1] || items[items.length - 1]
                    prev?.focus()
                  } else if (e.key === 'Home') {
                    e.preventDefault(); items[0]?.focus()
                  } else if (e.key === 'End') {
                    e.preventDefault(); items[items.length - 1]?.focus()
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); toggleExpanded(index)
                  }
                }

                return (
                  <div 
                    key={index} 
                    className={`faq-item ${isExpanded ? 'expanded' : ''}`}
                    role="listitem"
                  >
                    <div className="faq-question-row">
                      <button
                        id={qId}
                        className="faq-question"
                        onClick={() => toggleExpanded(index)}
                        onKeyDown={onKeyDown}
                        aria-expanded={isExpanded}
                        aria-controls={aId}
                      >
                        <span className="faq-question-text">{faq.question}</span>
                        <span className="faq-toggle-icon" aria-hidden="true">
                          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                        </span>
                      </button>
                      <a
                        href={anchor}
                        className="faq-anchor"
                        aria-label="Copy link to this question"
                        onClick={(e) => {
                          e.preventDefault()
                          const url = `${window.location.origin}${window.location.pathname}${anchor}`
                          navigator.clipboard?.writeText(url)
                        }}
                      >
                        <i className="fas fa-link" aria-hidden="true"></i>
                      </a>
                    </div>
                    
                    <div 
                      id={aId}
                      className={`faq-answer ${isExpanded ? 'expanded' : 'collapsed'}`}
                      aria-hidden={!isExpanded}
                      role="region"
                      aria-labelledby={qId}
                    >
                      <div className="faq-answer-content">
                        {typeof faq.answer === 'string' ? (
                          <p>{faq.answer}</p>
                        ) : (
                          faq.answer
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {showAside && (
              <aside className="faq-aside" aria-label="Help options">
                <div className="faq-help-card">
                  <h3>Still need help?</h3>
                  <p>Visit our Support Center or contact us and we’ll get back within 24 hours.</p>
                  <div className="faq-help-actions">
                    <a href="/support" className="btn btn-outline">Support Center</a>
                    <a href="/contact" className="btn btn-primary">Contact Us</a>
                  </div>
                </div>
              </aside>
            )}
          </div>

          {filteredFaqs.length === 0 && searchTerm && (
            <div className="faq-no-results">
              <p>No FAQs found matching "{searchTerm}"</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="faq-clear-search"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

// Predefined FAQ data sets for common pages
export const premaritalCounselingFAQs = [
  {
    question: "What is premarital counseling?",
    answer: "Premarital counseling is a specialized type of therapy designed to help couples prepare for marriage. It focuses on developing communication skills, understanding each other's expectations, and building a strong foundation for a lasting relationship."
  },
  {
    question: "How long does premarital counseling take?",
    answer: "Most premarital counseling programs consist of 5-8 sessions, typically lasting 50-90 minutes each. The duration can vary based on your specific needs, the counselor's approach, and any particular areas you want to focus on."
  },
  {
    question: "What topics are covered in premarital counseling?",
    answer: "Common topics include communication skills, conflict resolution, financial planning, family planning, intimacy, roles and responsibilities, family backgrounds, and future goals. Sessions are tailored to each couple's unique situation and concerns."
  },
  {
    question: "How much does premarital counseling cost?",
    answer: "Costs vary by location and provider, typically ranging from $75-200 per session. Many insurance plans cover couples therapy, and some religious organizations offer free or low-cost programs. The investment is minimal compared to the long-term benefits of a strong marriage."
  },
  {
    question: "Do we need premarital counseling if our relationship is going well?",
    answer: "Yes! Premarital counseling isn't just for couples with problems. It's a proactive approach to strengthen your relationship, learn valuable skills, and prepare for the realities of married life. Even strong couples benefit from professional guidance."
  },
  {
    question: "What's the difference between premarital counseling and couples therapy?",
    answer: "Premarital counseling is preventive and educational, focusing on preparation for marriage. Couples therapy typically addresses existing relationship problems. Premarital counseling is forward-looking while couples therapy often deals with current issues."
  },
  {
    question: "How do I choose the right premarital counselor?",
    answer: "Look for licensed professionals with specific training in premarital counseling. Consider their approach, experience, location, cost, and whether you both feel comfortable with them. Many couples prefer counselors who share their values or religious background."
  },
  {
    question: "Can premarital counseling prevent divorce?",
    answer: "While no counseling can guarantee marriage success, research shows premarital counseling reduces divorce rates by up to 30%. It helps couples develop skills and awareness that contribute to healthier, more satisfying marriages."
  }
]

export const findingCounselorFAQs = [
  {
    question: "How do I verify a counselor's credentials?",
    answer: "Check their license with your state's licensing board, verify their education and training, ask about their specific experience with premarital counseling, and ensure they maintain continuing education requirements."
  },
  {
    question: "Should we choose a male or female counselor?",
    answer: "The gender of your counselor is less important than their qualifications and how comfortable you both feel. Some couples have preferences based on personal comfort or cultural considerations, while others focus primarily on experience and approach."
  },
  {
    question: "What if we don't like our first counselor?",
    answer: "It's okay to change counselors if you don't feel it's a good fit after a few sessions. Finding the right match is important for successful counseling. Don't hesitate to seek someone whose style and approach better suit your needs."
  },
  {
    question: "Do religious counselors only work with couples of their faith?",
    answer: "Many religious counselors welcome couples of all faiths or no faith, though some may specialize in serving their own religious community. When contacting a counselor, ask about their approach and whether they're comfortable working with your beliefs."
  }
]

export const sessionFAQs = [
  {
    question: "What should we expect in our first session?",
    answer: "The first session typically involves introductions, discussing your relationship history, current strengths and concerns, goals for counseling, and an overview of the process. Your counselor will explain their approach and answer any questions you have."
  },
  {
    question: "Will we have homework between sessions?",
    answer: "Many counselors assign exercises or discussions to practice between sessions. These might include communication exercises, assessment tools, or specific topics to discuss. Homework helps reinforce what you learn and accelerates progress."
  },
  {
    question: "What if one of us is reluctant to attend?",
    answer: "It's common for one partner to be more enthusiastic initially. Start with an open conversation about concerns and benefits. Many reluctant partners become engaged once they experience the positive, non-judgmental environment of counseling."
  }
]

export default FAQ
