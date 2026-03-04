import React, { useState } from 'react'
import QuestionContainer from '../QuestionContainer'
import { supabase } from '../../../../../lib/supabaseClient'
import { getStateNameFromAbbr } from '../../../../../lib/utils'
import { sendProfileCreatedEmail, sendAdminNewSignupAlert } from '../../../../../lib/emailNotifications'
import { trackOnboardingComplete } from '../../../../../components/analytics/GoogleAnalytics'
import { CLERGY_PROFESSIONS } from '../../constants'

const Q20_Review = ({
  currentStep,
  profileData,
  profileId,
  user,
  utmParams,
  saving,
  error,
  setError,
  goToPreviousQuestion,
  refreshProfile,
  navigate
}) => {
  const [publishing, setPublishing] = useState(false)
  const isClergy = CLERGY_PROFESSIONS.includes(profileData.profession)

  const handlePublish = async () => {
    if (publishing) return // Prevent double-click
    if (!profileId || !user) {
      setError('Unable to publish profile. Please try again.')
      return
    }

    setPublishing(true)

    try {
      // Generate slug for profile URL
      const generateSlug = (name) => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .trim()
      }

      const slug = generateSlug(profileData.full_name)

      // Mark profile as completed and approved
      const { error: publishError } = await supabase
        .from('profiles')
        .update({
          slug: slug,
          onboarding_completed: true,
          onboarding_last_saved_at: new Date().toISOString(),
          status: 'approved',
          moderation_status: 'approved',
          moderation_reviewed_at: new Date().toISOString(),
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          accepting_new_clients: true
        })
        .eq('id', profileId)

      if (publishError) throw publishError

      // Generate profile URL
      const getCitySlug = (cityName) => {
        return cityName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
      }

      // Convert state abbreviation to full name for SEO-friendly URLs
      const stateSlug = getStateNameFromAbbr(profileData.state_province) || profileData.state_province?.toLowerCase()
      const citySlug = getCitySlug(profileData.city)
      const profileUrl = `/premarital-counseling/${stateSlug}/${citySlug}/${slug}`
      const fullProfileUrl = `${window.location.origin}${profileUrl}`

      // Send welcome email (non-blocking)
      try {
        await sendProfileCreatedEmail(
          profileData.email || user.email,
          { full_name: profileData.full_name },
          fullProfileUrl,
          window.location.origin
        )
      } catch (emailError) {
        console.error('Welcome email failed:', emailError)
      }

      // Send admin notification (non-blocking)
      try {
        await sendAdminNewSignupAlert({
          full_name: profileData.full_name,
          email: profileData.email || user.email,
          profession: profileData.profession,
          city: profileData.city,
          state_province: profileData.state_province,
          slug: slug,
          signup_source: utmParams?.signup_source || 'organic'
        })
      } catch (adminEmailError) {
        console.error('Admin notification failed:', adminEmailError)
      }

      // Fire analytics completion event
      trackOnboardingComplete(profileId, utmParams?.signup_source)

      // Refresh profile context
      await refreshProfile()

      // Navigate to success page
      navigate('/professional/profile-created', { state: { profileUrl } })

    } catch (err) {
      console.error('Error publishing profile:', err)
      setError('Failed to publish profile. Please try again.')
      setPublishing(false)
    }
  }

  const displayValue = (value, fallback = 'Not provided') => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : fallback
    }
    return value || fallback
  }

  // Truncate bio for review display
  const truncatedBio = profileData.bio
    ? profileData.bio.length > 200
      ? profileData.bio.substring(0, 200) + '...'
      : profileData.bio
    : null

  return (
    <QuestionContainer
      currentStep={currentStep}
      saving={saving || publishing}
      error={error}
      onBack={goToPreviousQuestion}
      onContinue={handlePublish}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '1rem', color: 'var(--slate)', marginBottom: '0.5rem' }}>
          Your profile is ready to go live. Couples in your area will be able to find and contact you.
        </p>
      </div>

      <div className="review-section">
        <h3 className="review-heading">Your Profile</h3>
        <div className="review-item">
          <span className="review-label">Name:</span>
          <span className="review-value">{displayValue(profileData.full_name)}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Profession:</span>
          <span className="review-value">{displayValue(profileData.profession)}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Location:</span>
          <span className="review-value">
            {profileData.city}, {profileData.state_province}
          </span>
        </div>
        <div className="review-item">
          <span className="review-label">Session Types:</span>
          <span className="review-value">{displayValue(profileData.session_types)}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Photo:</span>
          <span className="review-value">
            {profileData.photo_url ? 'Uploaded' : 'Not yet — you can add one from your dashboard'}
          </span>
        </div>
      </div>

      <div className="review-section">
        <h3 className="review-heading">{isClergy ? 'About Your Ministry' : 'About Your Practice'}</h3>
        {truncatedBio && (
          <div className="review-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="review-value" style={{ marginLeft: 0 }}>{truncatedBio}</span>
          </div>
        )}
      </div>

      <div className="review-section">
        <h3 className="review-heading">Contact Information</h3>
        <div className="review-item">
          <span className="review-label">Phone:</span>
          <span className="review-value">{displayValue(profileData.phone)}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Website:</span>
          <span className="review-value">{displayValue(profileData.website)}</span>
        </div>
      </div>

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'var(--ds-accent-soft)',
        borderRadius: '8px',
        border: '1px solid var(--ds-border)'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate)' }}>
          <i className="fa fa-lightbulb-o" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>
          <strong>After publishing</strong>, boost your visibility by adding specialties, certifications, pricing, and more from your dashboard.
        </p>
      </div>
    </QuestionContainer>
  )
}

export default Q20_Review
