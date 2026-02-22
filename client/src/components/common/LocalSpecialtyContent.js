import React from 'react'
// Link removed - not currently used

const LocalSpecialtyContent = ({ specialty, stateName, cityName }) => {
  if (!specialty) return null

  const locationName = cityName ? `${cityName}, ${stateName}` : stateName

  const getContent = () => {
    switch (specialty.slug) {
      case 'christian':
        return (
          <>
            <p>
              Couples in {locationName} seeking <strong>Christian premarital counseling</strong> can find guidance that aligns with their faith values.
              Whether through a local church in {cityName || stateName} or with a licensed Christian therapist, faith-based marriage preparation helps you build a Christ-centered union.
            </p>
            <h4 style={{ fontSize: '1.1rem', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Key Focus Areas for Christian Couples in {cityName || stateName}</h4>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: 'var(--space-4)' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Spiritual Foundation:</strong> Establishing prayer habits and spiritual intimacy before the wedding.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Biblical Roles:</strong> Discussing expectations for marriage based on Christian teachings.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Church Involvement:</strong> Navigating how you will participate in your local {locationName} faith community as a married couple.</li>
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
            <h4 style={{ fontSize: '1.1rem', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>What to Expect from Pre-Cana in {locationName}</h4>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: 'var(--space-4)' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Sacramental Theology:</strong> Understanding marriage as a lifelong covenant and sacrament.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>NFP (Natural Family Planning):</strong> Most dioceses in {stateName} require an introductory course in NFP methods.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>FOCCUS Inventory:</strong> Taking the FOCCUS assessment to guide conversations about communication, finances, and family of origin.</li>
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
            <h4 style={{ fontSize: '1.1rem', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Why Choose Gottman Premarital Therapy in {locationName}?</h4>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: 'var(--space-4)' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Evidence-Based:</strong> Backed by 40+ years of research predicting relationship success and failure.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Practical Tools:</strong> Learn actionable skills to manage conflict without devastating arguments.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Assessment-Driven:</strong> Often begins with the Gottman Relationship Checkup to pinpoint your exact strengths and growth areas as a couple.</li>
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
            <h4 style={{ fontSize: '1.1rem', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Benefits of Prepare/Enrich in {locationName}</h4>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: 'var(--space-4)' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Customized Focus:</strong> The questionnaire identifies your specific relationship strengths and growth areas immediately.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Personality Profiling:</strong> Helps you understand how your distinct SCOPE personality traits interact with your partner's.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Skill Building:</strong> Your {cityName || 'local'} facilitator will walk you through targeted workbook exercises on communication and financial management.</li>
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
            <h4 style={{ fontSize: '1.1rem', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>What SYMBIS Covers for {cityName || stateName} Couples</h4>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: 'var(--space-4)' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Marriage Mindset:</strong> Analyzes your individual attitudes and assumptions about marriage.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Bridging the Gap:</strong> Explores your distinct communication styles and emotional needs.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Financial Friction:</strong> Uncovers your "money personalities" to prevent future financial arguments.</li>
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
            <h4 style={{ fontSize: '1.1rem', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Advantages of Virtual Counseling in {locationName}</h4>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: 'var(--space-4)' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Long-Distance Friendly:</strong> Ideal if you and your partner are living in different cities before the wedding.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Broader Selection:</strong> You aren't limited to just counselors in {cityName || 'your immediate area'}; you can work with any specialist licensed in {stateName}.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Convenience:</strong> Easier to schedule around demanding jobs and wedding planning meetings.</li>
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
            <h4 style={{ fontSize: '1.1rem', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Common Goals for Couples in {locationName}</h4>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: 'var(--space-4)' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Expectation Management:</strong> Aligning your visions for the future and daily life.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Conflict Resolution:</strong> Learning how to argue fairly and repair quickly.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Financial Planning:</strong> Combining finances and agreeing on budgeting strategies.</li>
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
