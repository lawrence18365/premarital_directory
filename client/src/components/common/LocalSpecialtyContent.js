import React from 'react'
// Link removed - not currently used

const LocalSpecialtyContent = ({ specialty, stateName, cityName }) => {
  if (!specialty) return null
  
  const locationName = cityName ? `${cityName}, ${stateName}` : stateName
  
  // Dynamic content templates based on specialty type
  const getContent = () => {
    switch(specialty.slug) {
      case 'christian':
        return (
          <>
            <p>
              Couples in {locationName} seeking <strong>Christian premarital counseling</strong> can find guidance that aligns with their faith values. 
              Whether through a local church in {cityName || stateName} or with a licensed Christian therapist, faith-based marriage preparation helps you build a Christ-centered union.
            </p>
            <p>
              Common topics covered by {locationName} Christian counselors include spiritual leadership, prayer together, biblical roles in marriage, and navigating church involvement as a couple.
            </p>
          </>
        )
      case 'catholic':
        return (
          <>
             <p>
               For Catholic couples in {locationName}, completing <strong>Pre-Cana marriage preparation</strong> is a required step before the Sacrament of Matrimony.
               {cityName ? ` Parishes in the ${cityName} area` : ` Dioceses across ${stateName}`} typically offer weekend retreats, sponsor couple programs, or classes.
             </p>
             <p>
               Many Catholic counselors in {locationName} also use the FOCCUS inventory to help you discuss topics like family of origin, communication, and sacramental theology.
             </p>
          </>
        )
      case 'gottman':
        return (
          <>
            <p>
              The <strong>Gottman Method</strong> is a popular, research-based approach for couples in {locationName}. 
              Based on the "Sound Relationship House" theory, Gottman-trained therapists in {cityName || stateName} help you build "Love Maps," manage conflict, and create shared meaning.
            </p>
            <p>
              This scientific approach is ideal for {locationName} couples who value practical tools and evidence-based exercises over abstract talk therapy.
            </p>
          </>
        )
      case 'online':
        return (
          <>
            <p>
              <strong>Online premarital counseling</strong> is an increasingly popular choice for busy couples in {locationName}.
              Virtual sessions allow you to connect with top-rated counselors across {stateName} from the comfort of your home in {cityName || 'your local area'}.
            </p>
            <p>
              This is especially helpful for couples in {locationName} with different work schedules, or those in long-distance relationships before the wedding.
            </p>
          </>
        )
      default:
        return (
          <p>
            Finding the right <strong>{specialty.name} premarital counseling</strong> in {locationName} is an investment in your future happiness.
            Qualified professionals in the {cityName || stateName} area can help you navigate important conversations about finances, communication, and family planning before you say "I do."
          </p>
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
