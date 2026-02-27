import React from 'react'
import { Link } from 'react-router-dom'

// ── Data helpers ──────────────────────────────────────────────────────

function computeProfileStats(profiles) {
  if (!profiles || profiles.length === 0) return null

  const stats = {
    total: profiles.length,
    professions: {},
    sessionFormats: {},
    hasOnline: 0,
    hasInPerson: 0,
    hasFreeConsultation: 0,
    acceptsInsurance: 0,
    hasSlidingScale: 0,
    experienceRanges: [],
    credentials: {},
    faithTraditions: {},
    approaches: [],
  }

  profiles.forEach(p => {
    // Professions
    const prof = p.profession || 'Counselor'
    stats.professions[prof] = (stats.professions[prof] || 0) + 1

    // Session format
    const formats = Array.isArray(p.session_format) ? p.session_format : []
    formats.forEach(f => {
      stats.sessionFormats[f] = (stats.sessionFormats[f] || 0) + 1
    })
    if (formats.some(f => /online|virtual|telehealth|video/i.test(f))) stats.hasOnline++
    if (formats.some(f => /in.?person|office|in.?office/i.test(f))) stats.hasInPerson++

    // Pricing signals
    if (p.free_consultation) stats.hasFreeConsultation++
    if (p.accepts_insurance) stats.acceptsInsurance++
    if (p.sliding_scale || /sliding/i.test(p.pricing_range || '')) stats.hasSlidingScale++

    // Experience
    const yrs = Number(p.years_experience)
    if (yrs > 0) stats.experienceRanges.push(yrs)

    // Credentials
    const creds = Array.isArray(p.credentials) ? p.credentials : []
    creds.forEach(c => {
      if (c) stats.credentials[c] = (stats.credentials[c] || 0) + 1
    })

    // Faith
    const faith = Array.isArray(p.faith_tradition) ? p.faith_tradition : (p.faith_tradition ? [p.faith_tradition] : [])
    faith.forEach(f => {
      if (f) stats.faithTraditions[f] = (stats.faithTraditions[f] || 0) + 1
    })

    // Approaches
    const appr = Array.isArray(p.treatment_approaches) ? p.treatment_approaches : []
    appr.forEach(a => {
      if (a) stats.approaches.push(a)
    })
  })

  // Derived
  const expArr = stats.experienceRanges
  stats.avgExperience = expArr.length > 0 ? Math.round(expArr.reduce((s, v) => s + v, 0) / expArr.length) : null
  stats.maxExperience = expArr.length > 0 ? Math.max(...expArr) : null
  stats.minExperience = expArr.length > 0 ? Math.min(...expArr) : null

  // Top professions sorted
  stats.topProfessions = Object.entries(stats.professions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  // Top credentials sorted
  stats.topCredentials = Object.entries(stats.credentials)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Top faith traditions
  stats.topFaiths = Object.entries(stats.faithTraditions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  // Top approaches (deduplicated with counts)
  const approachCounts = {}
  stats.approaches.forEach(a => { approachCounts[a] = (approachCounts[a] || 0) + 1 })
  stats.topApproaches = Object.entries(approachCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return stats
}

function formatProfession(name) {
  // Clean up DB values to be human-readable
  return (name || 'Counselor')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function pluralize(count, singular, plural) {
  return count === 1 ? singular : (plural || singular + 's')
}

// ── Market Snapshot renderer ──────────────────────────────────────────

const MarketSnapshot = ({ stats, specialty, locationName, cityName, stateName }) => {
  if (!stats || stats.total === 0) return null

  const bullets = []

  // Provider types
  if (stats.topProfessions.length > 0) {
    const parts = stats.topProfessions
      .map(([prof, count]) => `${count} ${formatProfession(prof).toLowerCase()}${count !== 1 ? 's' : ''}`)
    bullets.push(
      <li key="types">
        <strong>Provider types:</strong> The {stats.total} {specialty.name.toLowerCase()} {pluralize(stats.total, 'counselor')} in {locationName} include {parts.join(', ')}.
      </li>
    )
  }

  // Experience
  if (stats.avgExperience && stats.experienceRanges.length >= 2) {
    bullets.push(
      <li key="exp">
        <strong>Experience:</strong> {specialty.name} counselors here average {stats.avgExperience} years of practice{stats.maxExperience > stats.avgExperience + 5 ? `, with the most experienced at ${stats.maxExperience}+ years` : ''}.
      </li>
    )
  }

  // Session formats
  if (stats.hasOnline > 0 || stats.hasInPerson > 0) {
    const formatParts = []
    if (stats.hasInPerson > 0) formatParts.push(`${stats.hasInPerson} offer in-person sessions`)
    if (stats.hasOnline > 0) formatParts.push(`${stats.hasOnline} offer online/video sessions`)
    if (stats.hasOnline > 0 && stats.hasInPerson > 0) {
      const both = Math.min(stats.hasOnline, stats.hasInPerson)
      if (both > 0) formatParts.push(`${both} offer both`)
    }
    bullets.push(
      <li key="format">
        <strong>Session format:</strong> {formatParts.slice(0, 2).join(' and ')}{cityName ? `, giving you flexibility regardless of your schedule in ${cityName}` : ''}.
      </li>
    )
  }

  // Free consultations / insurance / sliding scale
  const accessParts = []
  if (stats.hasFreeConsultation > 0) accessParts.push(`${stats.hasFreeConsultation} offer a free initial consultation`)
  if (stats.acceptsInsurance > 0) accessParts.push(`${stats.acceptsInsurance} accept insurance`)
  if (stats.hasSlidingScale > 0) accessParts.push(`${stats.hasSlidingScale} offer sliding-scale pricing`)
  if (accessParts.length > 0) {
    bullets.push(
      <li key="access">
        <strong>Affordability:</strong> {accessParts.join(', ')}.
      </li>
    )
  }

  // Top approaches/methods
  if (stats.topApproaches.length >= 2) {
    const methods = stats.topApproaches
      .slice(0, 4)
      .map(([name]) => name)
      .join(', ')
    bullets.push(
      <li key="methods">
        <strong>Common methods:</strong> Popular approaches among {locationName} {specialty.name.toLowerCase()} counselors include {methods}.
      </li>
    )
  }

  // Top credentials
  if (stats.topCredentials.length >= 2) {
    const creds = stats.topCredentials
      .slice(0, 4)
      .map(([name, count]) => `${name} (${count})`)
      .join(', ')
    bullets.push(
      <li key="creds">
        <strong>Credentials:</strong> Licenses held include {creds}.
      </li>
    )
  }

  // Faith traditions (only for faith-related specialties or if significant presence)
  if (stats.topFaiths.length > 0 && ['christian', 'catholic', 'interfaith'].includes(specialty.slug)) {
    const faiths = stats.topFaiths
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)
      .join(', ')
    bullets.push(
      <li key="faith">
        <strong>Faith traditions represented:</strong> {faiths}.
      </li>
    )
  }

  if (bullets.length < 2) return null

  return (
    <div style={{ marginTop: 'var(--space-5)' }}>
      <h4 style={{ fontSize: '1.1rem', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
        {specialty.name} Counselors in {locationName} at a Glance
      </h4>
      <ul style={{ paddingLeft: '1.5rem', marginBottom: 'var(--space-4)' }}>
        {bullets.map(b => (
          <li key={b.key} style={{ marginBottom: '0.5rem' }}>{b.props.children}</li>
        ))}
      </ul>
    </div>
  )
}

// ── How to Choose section ─────────────────────────────────────────────

const HowToChoose = ({ specialty, locationName, cityName, stateName, stateSlug }) => (
  <div style={{ marginTop: 'var(--space-5)' }}>
    <h4 style={{ fontSize: '1.1rem', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
      How to Choose a {specialty.name} Counselor in {cityName || stateName}
    </h4>
    <ol style={{ paddingLeft: '1.5rem', marginBottom: 'var(--space-4)' }}>
      <li style={{ marginBottom: '0.5rem' }}>
        <strong>Check credentials and training</strong> — look for licensed professionals (LMFT, LPC, LCSW, PsyD) who have specific training in {specialty.name.toLowerCase()} methods.
      </li>
      <li style={{ marginBottom: '0.5rem' }}>
        <strong>Read their approach</strong> — browse profiles above and read how each counselor describes their style. The right fit is someone whose philosophy resonates with both of you.
      </li>
      <li style={{ marginBottom: '0.5rem' }}>
        <strong>Consider logistics</strong> — session format (in-person vs. online), scheduling flexibility, and location in {cityName || stateName} all matter when you're juggling wedding planning.
      </li>
      <li style={{ marginBottom: '0.5rem' }}>
        <strong>Ask about structure</strong> — some counselors use a fixed-session program (e.g., 6 sessions), while others are open-ended. Know what to expect going in.
      </li>
    </ol>
    {stateSlug && (
      <p style={{ fontSize: '0.95rem' }}>
        Browse all <Link to={`/premarital-counseling/${stateSlug}`} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>premarital counselors in {stateName}</Link> or
        explore <Link to="/premarital-counseling" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>other specialties and locations</Link>.
      </p>
    )}
  </div>
)

// ── Main component ────────────────────────────────────────────────────

const LocalSpecialtyContent = ({ specialty, stateName, cityName, profiles, stateSlug }) => {
  if (!specialty) return null

  const locationName = cityName ? `${cityName}, ${stateName}` : stateName
  const stats = computeProfileStats(profiles)

  const h4Style = { fontSize: '1.1rem', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }
  const ulStyle = { paddingLeft: '1.5rem', marginBottom: 'var(--space-4)' }
  const liStyle = { marginBottom: '0.5rem' }

  const getContent = () => {
    switch (specialty.slug) {
      case 'christian':
        return (
          <>
            <p>
              Couples in {locationName} seeking <strong>Christian premarital counseling</strong> can find guidance that aligns with their faith values.
              Whether through a local church in {cityName || stateName} or with a licensed Christian therapist, faith-based marriage preparation helps you build a Christ-centered union.
            </p>
            <h4 style={h4Style}>Key Focus Areas for Christian Couples in {cityName || stateName}</h4>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Spiritual Foundation:</strong> Establishing prayer habits and spiritual intimacy before the wedding.</li>
              <li style={liStyle}><strong>Biblical Roles:</strong> Discussing expectations for marriage based on Christian teachings.</li>
              <li style={liStyle}><strong>Church Involvement:</strong> Navigating how you will participate in your local {locationName} faith community as a married couple.</li>
            </ul>
            <p>
              Many Christian counselors and pastors in {locationName} utilize structured assessments like SYMBIS or Prepare/Enrich alongside biblical counseling to provide comprehensive preparation for your marriage.
            </p>
          </>
        )
      case 'catholic':
        return (
          <>
            <p>
              For Catholic couples in {locationName}, <strong>Pre-Cana marriage preparation</strong> is a mandatory requirement to receive the Sacrament of Holy Matrimony.
              {cityName ? ` The listings in ${cityName}` : ` The listings in ${stateName}`} highlight verified parish and diocesan programs to help you fulfill these requirements.
            </p>
            <h4 style={h4Style}>What to Expect from Pre-Cana in {locationName}</h4>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Sacramental Theology:</strong> Understanding marriage as a lifelong covenant and sacrament.</li>
              <li style={liStyle}><strong>NFP (Natural Family Planning):</strong> Most dioceses in {stateName} require an introductory course in NFP methods.</li>
              <li style={liStyle}><strong>FOCCUS Inventory:</strong> Taking the FOCCUS assessment to guide conversations about communication, finances, and family of origin.</li>
            </ul>
            <p>
              We recommend booking your Pre-Cana retreat or counseling sessions at least 6 months before your wedding date, as {locationName} parishes often require early registration.
            </p>
          </>
        )
      case 'gottman':
        return (
          <>
            <p>
              The <strong>Gottman Method</strong> is a highly popular, research-based approach for engaged couples in {locationName}.
              Based on Dr. John Gottman's "Sound Relationship House" theory, Gottman-trained therapists in {cityName || stateName} help you build "Love Maps," manage conflict, and create shared meaning.
            </p>
            <h4 style={h4Style}>Why Choose Gottman Premarital Therapy in {locationName}?</h4>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Evidence-Based:</strong> Backed by 40+ years of research predicting relationship success and failure.</li>
              <li style={liStyle}><strong>Practical Tools:</strong> Learn actionable skills to manage conflict without devastating arguments.</li>
              <li style={liStyle}><strong>Assessment-Driven:</strong> Often begins with the Gottman Relationship Checkup to pinpoint your exact strengths and growth areas as a couple.</li>
            </ul>
            <p>
              This scientific approach is ideal for {locationName} couples who value practical tools, measurable progress, and structured exercises over abstract talk therapy.
            </p>
          </>
        )
      case 'prepare-enrich':
        return (
          <>
            <p>
              <strong>Prepare/Enrich</strong> is one of the most widely used premarital assessment tools by counselors in {locationName}.
              Before your first session, you and your partner will take an online inventory that creates a customized report for your therapist or clergy member in {cityName || stateName} to guide your sessions.
            </p>
            <h4 style={h4Style}>Benefits of Prepare/Enrich in {locationName}</h4>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Customized Focus:</strong> The questionnaire identifies your specific relationship strengths and growth areas immediately.</li>
              <li style={liStyle}><strong>Personality Profiling:</strong> Helps you understand how your distinct SCOPE personality traits interact with your partner's.</li>
              <li style={liStyle}><strong>Skill Building:</strong> Your {cityName || 'local'} facilitator will walk you through targeted workbook exercises on communication and financial management.</li>
            </ul>
          </>
        )
      case 'symbis':
        return (
          <>
            <p>
              The <strong>SYMBIS (Saving Your Marriage Before It Starts)</strong> assessment is available through certified facilitators in {locationName}.
              Created by Drs. Les and Leslie Parrott, this highly engaging program is frequently used by Christian counselors, officiants, and pastors in {cityName || stateName}.
            </p>
            <h4 style={h4Style}>What SYMBIS Covers for {cityName || stateName} Couples</h4>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Marriage Mindset:</strong> Analyzes your individual attitudes and assumptions about marriage.</li>
              <li style={liStyle}><strong>Bridging the Gap:</strong> Explores your distinct communication styles and emotional needs.</li>
              <li style={liStyle}><strong>Financial Friction:</strong> Uncovers your "money personalities" to prevent future financial arguments.</li>
            </ul>
          </>
        )
      case 'online':
        return (
          <>
            <p>
              <strong>Online premarital counseling</strong> is an increasingly popular choice for busy engaged couples in {locationName}.
              Virtual sessions via Zoom or telehealth platforms allow you to connect with top-rated counselors across {stateName} from the comfort of your home in {cityName || 'your local area'}.
            </p>
            <h4 style={h4Style}>Advantages of Virtual Counseling in {locationName}</h4>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Long-Distance Friendly:</strong> Ideal if you and your partner are living in different cities before the wedding.</li>
              <li style={liStyle}><strong>Broader Selection:</strong> You aren't limited to just counselors in {cityName || 'your immediate area'}; you can work with any specialist licensed in {stateName}.</li>
              <li style={liStyle}><strong>Convenience:</strong> Easier to schedule around demanding jobs and wedding planning meetings.</li>
            </ul>
          </>
        )
      default:
        return (
          <>
            <p>
              Finding the right <strong>{specialty.name} premarital counseling</strong> in {locationName} is an investment in your future happiness.
              Qualified professionals in the {cityName || stateName} area can help you navigate important conversations about finances, communication, and family planning before you say "I do."
            </p>
            <h4 style={h4Style}>Common Goals for Couples in {locationName}</h4>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Expectation Management:</strong> Aligning your visions for the future and daily life.</li>
              <li style={liStyle}><strong>Conflict Resolution:</strong> Learning how to argue fairly and repair quickly.</li>
              <li style={liStyle}><strong>Financial Planning:</strong> Combining finances and agreeing on budgeting strategies.</li>
            </ul>
          </>
        )
    }
  }

  return (
    <div className="local-specialty-content" style={{
      marginTop: 'var(--space-8)',
      padding: 'var(--space-6)',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--gray-200)'
    }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-4)' }}>
        About {specialty.name} Counseling in {locationName}
      </h3>
      <div className="prose" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        {getContent()}

        {/* Data-driven market snapshot — unique per page */}
        <MarketSnapshot
          stats={stats}
          specialty={specialty}
          locationName={locationName}
          cityName={cityName}
          stateName={stateName}
        />

        {/* How to choose — adds actionable content + internal links */}
        <HowToChoose
          specialty={specialty}
          locationName={locationName}
          cityName={cityName}
          stateName={stateName}
          stateSlug={stateSlug}
        />
      </div>

      {!cityName && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.9rem' }}>
            <strong>Tip:</strong> You can also browse our directory by city to find {specialty.name.toLowerCase()} counselors closer to home.
          </p>
        </div>
      )}
    </div>
  )
}

export default LocalSpecialtyContent
