import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const EMBED_SNIPPET_IFRAME = `<div style="max-width:520px">
  <iframe
    src="https://www.weddingcounselors.com/embed/find?ref=church"
    width="100%"
    height="420"
    style="border:0;border-radius:12px;overflow:hidden"
    loading="lazy"
    title="Find premarital counseling"
  ></iframe>
  <div style="font-size:12px;margin-top:8px">
    Powered by <a href="https://www.weddingcounselors.com/for-churches">WeddingCounselors.com</a>
  </div>
</div>`

const EMBED_SNIPPET_SCRIPT = `<div id="wc-widget"></div>
<script src="https://www.weddingcounselors.com/widget.js" data-ref="church"></script>`

const ForChurchesPage = () => {
  const [copiedSnippet, setCopiedSnippet] = useState(null)
  const partnerToolsUrl = '/partners?audience=church'

  const handleCopy = (snippet, label) => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedSnippet(label)
      setTimeout(() => setCopiedSnippet(null), 2000)
    })
  }

  const faqs = [
    {
      question: 'Does this cost anything?',
      answer: 'No. The widget and directory listing are completely free for churches and religious organizations.'
    },
    {
      question: 'Do you endorse specific counselors?',
      answer: 'No. We provide a directory of reviewed listings. Couples choose their own provider. We remove spam and fraudulent listings but do not guarantee outcomes.'
    },
    {
      question: 'Can we request edits or removal?',
      answer: 'Yes. You can update your program listing at any time or request removal by emailing hello@weddingcounselors.com.'
    },
    {
      question: 'Does the widget share couple data with us?',
      answer: 'No. Couples search and contact providers directly through the directory. No personal information is shared with your church through the widget.'
    },
    {
      question: 'Can we list our own Pre-Cana or marriage prep program?',
      answer: 'Absolutely. Submit your program details and we will add it to the directory so couples in your area can find it alongside other counseling options.'
    }
  ]

  return (
    <div className="page-container">
      <SEOHelmet
        title="For Churches — Free Premarital Counseling Widget | WeddingCounselors.com"
        description="Add a free 'find premarital counseling' search widget to your church website. Help engaged couples find Pre-Cana, marriage prep, and licensed counselors near them."
        url="/for-churches"
        canonicalUrl="https://www.weddingcounselors.com/for-churches"
        faqs={faqs}
      />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #0a4a4a) 100%)',
        color: 'white',
        padding: 'var(--space-16) 0 var(--space-12)'
      }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.25rem', marginBottom: 'var(--space-4)', color: 'white' }}>
              Partner With Us to Help Engaged Couples Find Premarital Counseling
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.95, marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
              Add a simple search box to your marriage preparation page so couples can find
              counselors and programs nearby — including Catholic Pre-Cana, online options,
              and evidence-based approaches.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to={partnerToolsUrl}
                className="btn btn-primary"
                style={{ background: 'white', color: 'var(--primary)', fontWeight: 600 }}
              >
                Generate My Widget
              </Link>
              <a
                href="#list-program"
                className="btn btn-outline"
                style={{ borderColor: 'white', color: 'white' }}
              >
                List Your Church Program
              </a>
            </div>
            <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-4)', opacity: 0.8 }}>
              Free for churches. Reviewed listings. Built for couples who need clear next steps.
            </p>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="container-narrow">
          {/* How It Works */}
          <div className="content-section" style={{ paddingTop: 'var(--space-12)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>How It Works</h2>
            <div className="feature-grid" style={{ gap: 'var(--space-6)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto var(--space-3)', fontSize: '1.25rem', fontWeight: 700
                }}>1</div>
                <h3>Embed the widget</h3>
                <p>Copy a short code snippet and paste it on your marriage prep page. The ref code makes later reporting possible.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto var(--space-3)', fontSize: '1.25rem', fontWeight: 700
                }}>2</div>
                <h3>Couples search by city</h3>
                <p>They choose a format — in-person, online, Pre-Cana, Gottman, or any specialty.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto var(--space-3)', fontSize: '1.25rem', fontWeight: 700
                }}>3</div>
                <h3>They contact a counselor directly</h3>
                <p>You do not need to manage referrals. Couples reach out to providers on their own.</p>
              </div>
            </div>
          </div>

          {/* Why Churches Use This */}
          <div className="content-section">
            <h2>Why Churches Use This</h2>
            <ul>
              <li><strong>Saves staff time</strong> — stop fielding "who do you recommend?" emails and phone calls</li>
              <li><strong>Clear next step for couples</strong> — instead of a vague referral, give them a tool to find and compare options</li>
              <li><strong>Highlight your own program</strong> — list your church's Pre-Cana or marriage prep alongside counseling options</li>
              <li><strong>No cost, no commitment</strong> — remove the widget any time</li>
            </ul>
          </div>

          {/* Embed Section */}
          <div id="embed-section" className="content-section" style={{
            background: 'var(--bg-secondary)',
            padding: 'var(--space-8)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-200)'
          }}>
            <h2 style={{ marginTop: 0 }}>Add the Widget to Your Website in 60 Seconds</h2>

            <h3>Option A: Iframe Embed (simplest)</h3>
            <p>Works on any website. Copy and paste this into your page HTML:</p>
            <div style={{ position: 'relative' }}>
              <pre style={{
                background: 'var(--gray-900, #1a1a2e)',
                color: '#e0e0e0',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                overflow: 'auto',
                fontSize: '0.8rem',
                lineHeight: 1.5
              }}>
                <code>{EMBED_SNIPPET_IFRAME}</code>
              </pre>
              <button
                onClick={() => handleCopy(EMBED_SNIPPET_IFRAME, 'iframe')}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: 'var(--space-1) var(--space-3)',
                  background: copiedSnippet === 'iframe' ? '#22c55e' : 'var(--primary)',
                  color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', fontSize: '0.8rem'
                }}
              >
                {copiedSnippet === 'iframe' ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <h3 style={{ marginTop: 'var(--space-8)' }}>Option B: Script Embed (auto-styled)</h3>
            <p>
              Automatically renders the widget and includes a "Powered by" link.
              Best for consistent styling across sites:
            </p>
            <div style={{ position: 'relative' }}>
              <pre style={{
                background: 'var(--gray-900, #1a1a2e)',
                color: '#e0e0e0',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                overflow: 'auto',
                fontSize: '0.8rem',
                lineHeight: 1.5
              }}>
                <code>{EMBED_SNIPPET_SCRIPT}</code>
              </pre>
              <button
                onClick={() => handleCopy(EMBED_SNIPPET_SCRIPT, 'script')}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: 'var(--space-1) var(--space-3)',
                  background: copiedSnippet === 'script' ? '#22c55e' : 'var(--primary)',
                  color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', fontSize: '0.8rem'
                }}
              >
                {copiedSnippet === 'script' ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <p style={{ marginTop: 'var(--space-6)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Need help? Build a tracked version in the <Link to={partnerToolsUrl}>partner tools</Link> or email us your page URL at{' '}
              <a href="mailto:hello@weddingcounselors.com">hello@weddingcounselors.com</a>{' '}
              and we will generate the exact embed code for your site.
            </p>
          </div>

          {/* List Your Program */}
          <div id="list-program" className="content-section">
            <h2>List Your Church Program</h2>
            <p>
              Have a Pre-Cana, marriage prep, or premarital counseling program at your church?
              We will add it to the directory so couples in your area can find it.
            </p>
            <p>Tell us about your program:</p>
            <ul>
              <li>Church name and city</li>
              <li>Contact person and email</li>
              <li>Program type (Pre-Cana, marriage prep course, mentoring, etc.)</li>
              <li>Schedule and frequency</li>
              <li>Languages offered</li>
              <li>Link to your program page (if you have one)</li>
            </ul>
            <div style={{ marginTop: 'var(--space-6)' }}>
              <Link
                to="/contact"
                className="btn btn-primary btn-large"
              >
                Submit Your Program
              </Link>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                Free listing. We will follow up within 2 business days.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div className="content-section">
            <h2>Frequently Asked Questions</h2>
            {faqs.map((faq) => (
              <div key={faq.question} style={{ marginBottom: 'var(--space-6)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-2)' }}>{faq.question}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{faq.answer}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="about-cta" style={{ marginBottom: 'var(--space-12)' }}>
            <h2>Ready to Help Your Couples?</h2>
            <p className="lead">
              Give engaged couples a clear next step for premarital counseling.
            </p>
            <div className="cta-actions">
              <a href="#embed-section" className="btn btn-primary btn-large">
                Embed the Widget
              </a>
              <Link to="/contact" className="btn btn-secondary btn-large">
                Submit Your Program
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForChurchesPage
