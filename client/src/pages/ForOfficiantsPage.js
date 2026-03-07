import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const EMBED_SNIPPET_IFRAME = `<div style="max-width:520px">
  <iframe
    src="https://www.weddingcounselors.com/embed/find?ref=officiant"
    width="100%"
    height="420"
    style="border:0;border-radius:12px;overflow:hidden"
    loading="lazy"
    title="Find premarital counseling"
  ></iframe>
  <div style="font-size:12px;margin-top:8px">
    Powered by <a href="https://www.weddingcounselors.com/for-officiants">WeddingCounselors.com</a>
  </div>
</div>`

const EMBED_SNIPPET_SCRIPT = `<div id="wc-widget"></div>
<script src="https://www.weddingcounselors.com/widget.js" data-ref="officiant"></script>`

const CITY_LINKS = [
  { name: 'Dallas', path: '/premarital-counseling/texas/dallas' },
  { name: 'Houston', path: '/premarital-counseling/texas/houston' },
  { name: 'Atlanta', path: '/premarital-counseling/georgia/atlanta' },
  { name: 'Nashville', path: '/premarital-counseling/tennessee/nashville' },
  { name: 'Chicago', path: '/premarital-counseling/illinois/chicago' },
  { name: 'Charlotte', path: '/premarital-counseling/north-carolina/charlotte' },
  { name: 'Phoenix', path: '/premarital-counseling/arizona/phoenix' },
  { name: 'Denver', path: '/premarital-counseling/colorado/denver' },
]

const ForOfficiantsPage = () => {
  const [copiedSnippet, setCopiedSnippet] = useState(null)
  const partnerToolsUrl = '/partners?audience=officiant'

  const handleCopy = (snippet, label) => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedSnippet(label)
      setTimeout(() => setCopiedSnippet(null), 2000)
    })
  }

  const faqs = [
    {
      question: 'Does this cost anything?',
      answer: 'No. The directory link and embed widget are completely free for officiants. There is no cost to you or to the couples you refer.'
    },
    {
      question: 'Who are the counselors on your site?',
      answer: 'Our directory includes licensed marriage and family therapists, certified premarital coaches (e.g., PREPARE/ENRICH, Gottman), and clergy who offer structured marriage preparation programs. Listings are reviewed before going live.'
    },
    {
      question: 'Will couples\' info be shared with me?',
      answer: 'No. Couples search the directory and contact providers directly. No personal information is shared back with you.'
    },
    {
      question: 'Can I recommend specific counselors?',
      answer: 'You can share the general city link and let couples browse all options, or you can link directly to a specific counselor\'s profile page if you have a preferred provider.'
    },
    {
      question: 'I do premarital counseling myself — can I get listed?',
      answer: 'Absolutely. If you offer structured premarital counseling or marriage preparation, you can create a free listing. Just sign up at our professional portal or email us at hello@weddingcounselors.com.'
    }
  ]

  return (
    <div className="page-container">
      <SEOHelmet
        title="For Officiants — Free Premarital Counseling Directory Link | WeddingCounselors.com"
        description="Give your engaged couples a vetted premarital counseling directory link. Free for officiants — licensed therapists, certified programs, and clergy counselors in every major city."
        url="/for-officiants"
        canonicalUrl="https://www.weddingcounselors.com/for-officiants"
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
              Give Every Couple You Marry a Clear Path to Premarital Counseling
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.95, marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
              You recommend premarital counseling — we make it easy for couples to actually find one.
              Get a free, shareable directory link for your city. Add it to your welcome packet,
              website, or booking confirmation.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to={partnerToolsUrl}
                className="btn btn-primary"
                style={{ background: 'white', color: 'var(--primary)', fontWeight: 600 }}
              >
                Generate My Tracked Link
              </Link>
              <a
                href="#how-it-works"
                className="btn btn-outline"
                style={{ borderColor: 'white', color: 'white' }}
              >
                See How It Works
              </a>
            </div>
            <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-4)', opacity: 0.8 }}>
              Free for officiants. Vetted listings. One link replaces the referral runaround.
            </p>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="container-narrow">
          {/* How It Works */}
          <div id="how-it-works" className="content-section" style={{ paddingTop: 'var(--space-12)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>How It Works</h2>
            <div className="feature-grid" style={{ gap: 'var(--space-6)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto var(--space-3)', fontSize: '1.25rem', fontWeight: 700
                }}>1</div>
                <h3>We send you a link</h3>
                <p>A personalized city page URL for your area, with tracking included, like weddingcounselors.com/premarital-counseling/texas/dallas.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto var(--space-3)', fontSize: '1.25rem', fontWeight: 700
                }}>2</div>
                <h3>You share it with couples</h3>
                <p>Bookmark it, add it to your welcome packet, include it in your booking confirmation, or link from your website.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto var(--space-3)', fontSize: '1.25rem', fontWeight: 700
                }}>3</div>
                <h3>Couples find a counselor</h3>
                <p>They browse, filter by style (faith-based, secular, online), and contact a counselor directly. You never have to manage referrals.</p>
              </div>
            </div>
          </div>

          {/* Why Officiants Use This */}
          <div className="content-section">
            <h2>Why Officiants Use This</h2>
            <ul>
              <li><strong>Saves you from playing referral matchmaker</strong> — stop fielding "who do you recommend?" texts and emails</li>
              <li><strong>Vetted listings</strong> — licensed therapists, certified programs (Gottman, PREPARE/ENRICH), and clergy counselors</li>
              <li><strong>Covers all styles</strong> — faith-based, secular, online, in-person — so every couple finds a fit</li>
              <li><strong>Free for you and free for couples</strong> — no cost, no commitment, no catch</li>
              <li><strong>Your couples get better-prepared marriages</strong> — and you get the peace of mind that they actually followed through</li>
            </ul>
          </div>

          {/* City Link Section */}
          <div id="city-link-section" className="content-section" style={{
            background: 'var(--bg-secondary)',
            padding: 'var(--space-8)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-200)'
          }}>
            <h2 style={{ marginTop: 0 }}>Get Your Free City Link</h2>
            <p>
              Build a tracked city link yourself in the partner tools. If you just want a quick starting point, here are some of our most popular cities:
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-4)',
              marginBottom: 'var(--space-6)'
            }}>
              {CITY_LINKS.map((city) => (
                <Link
                  key={city.name}
                  to={city.path}
                  style={{
                    display: 'block',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'white',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'var(--primary)',
                    fontWeight: 500,
                    textAlign: 'center'
                  }}
                >
                  {city.name}
                </Link>
              ))}
            </div>

            <p style={{ fontSize: '0.95rem' }}>
              Don't see your city? Every city in the US has a page. Just search for it on{' '}
              <Link to="/premarital-counseling">our directory</Link>, or email us your city
              and we will send you the exact link:
            </p>
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Link
                to={partnerToolsUrl}
                className="btn btn-primary btn-large"
              >
                Open Partner Tools
              </Link>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                Generate your own tracked city link, widget, or planner version instantly.
              </p>
            </div>
          </div>

          {/* Embed Widget Section */}
          <div className="content-section" style={{
            background: 'var(--bg-secondary)',
            padding: 'var(--space-8)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-200)'
          }}>
            <h2 style={{ marginTop: 0 }}>Have a Website? Embed the Search Widget</h2>
            <p>
              If you have a website, you can add a search box so couples can find counselors
              right from your page. Takes 60 seconds.
            </p>

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

          {/* Social Proof / Trust */}
          <div className="content-section" style={{ textAlign: 'center' }}>
            <h2>A Directory You Can Trust</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Hundreds of counselors listed across cities nationwide. Our directory includes
              licensed marriage and family therapists, certified premarital coaches, and
              clergy offering structured marriage preparation programs.
            </p>
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
              Give every couple you marry a clear next step for premarital counseling.
            </p>
            <div className="cta-actions">
              <a href="#city-link-section" className="btn btn-primary btn-large">
                Get Your Free City Link
              </a>
              <a
                href="mailto:hello@weddingcounselors.com?subject=City link request&body=Hi! I'm a wedding officiant in [YOUR CITY, STATE]. Please send me a directory link I can share with my couples."
                className="btn btn-secondary btn-large"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForOfficiantsPage
