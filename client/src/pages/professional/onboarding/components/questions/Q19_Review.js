import React from 'react'
import QuestionContainer from '../QuestionContainer'
import { supabase } from '../../../../../lib/supabaseClient'
import { sendProfileCreatedEmail, sendAdminNewSignupAlert } from '../../../../../lib/emailNotifications'

const Q19_Review = ({
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
  const handlePublish = async () => {
    if (!profileId || !user) {
      setError('Unable to publish profile. Please try again.')
      return
    }

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
          moderation_status: 'approved',
          moderation_reviewed_at: new Date().toISOString(),
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          accepting_new_clients: true
        })
        .eq('id', profileId)

      if (publishError) throw publishError

      // Generate profile URL
      const getStateSlug = (stateAbbr) => {
        return stateAbbr.toLowerCase()
      }

      const getCitySlug = (cityName) => {
        return cityName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
      }

      const stateSlug = getStateSlug(profileData.state_province)
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

      // Refresh profile context
      await refreshProfile()

      // Navigate to dashboard
      navigate('/professional/dashboard')

    } catch (err) {
      console.error('Error publishing profile:', err)
      setError('Failed to publish profile. Please try again.')
    }
  }

  const displayValue = (value, fallback = 'Not provided') => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : fallback
    }
    return value || fallback
  }

  return (
    <QuestionContainer
      currentStep={currentStep}
      saving={saving}
      error={error}
      onBack={goToPreviousQuestion}
      onContinue={handlePublish}
    >
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '1rem', color: 'var(--slate)', marginBottom: '1.5rem' }}>
          Review your profile before publishing. You can edit these details anytime from your dashboard.
        </p>
      </div>

      <div className="review-section">
        <h3 className="review-heading">Basic Information</h3>
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
            {profileData.photo_url ? 'Uploaded ✓' : 'Not provided'}
          </span>
        </div>
      </div>

      <div className="review-section">
        <h3 className="review-heading">About You</h3>
        <div className="review-item">
          <span className="review-label">Bio:</span>
          <span className="review-value">
            {profileData.bio ? `${profileData.bio.substring(0, 150)}...` : 'Not provided'}
          </span>
        </div>
        {profileData.specialties && profileData.specialties.length > 0 && (
          <div className="review-item">
            <span className="review-label">Specialties:</span>
            <span className="review-value">{displayValue(profileData.specialties)}</span>
          </div>
        )}
        {profileData.faith_tradition && (
          <div className="review-item">
            <span className="review-label">Faith Tradition:</span>
            <span className="review-value">{displayValue(profileData.faith_tradition)}</span>
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

      {(profileData.session_fee_min || profileData.session_fee_max) && (
        <div className="review-section">
          <h3 className="review-heading">Pricing</h3>
          <div className="review-item">
            <span className="review-label">Session Fees:</span>
            <span className="review-value">
              {profileData.session_fee_min && profileData.session_fee_max
                ? `$${profileData.session_fee_min} - $${profileData.session_fee_max}`
                : profileData.session_fee_min
                ? `$${profileData.session_fee_min}`
                : 'Not provided'}
            </span>
          </div>
          {profileData.offers_free_consultation && (
            <div className="review-item">
              <span className="review-value">✓ Offers free consultation</span>
            </div>
          )}
          {profileData.sliding_scale && (
            <div className="review-item">
              <span className="review-value">✓ Offers sliding scale fees</span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .review-section {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .review-section:last-child {
          border-bottom: none;
        }

        .review-heading {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--charcoal);
          margin-bottom: 1rem;
        }

        .review-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
        }

        .review-label {
          font-weight: 600;
          color: var(--slate);
          min-width: 140px;
        }

        .review-value {
          color: var(--charcoal);
          flex: 1;
        }
      `}</style>
    </QuestionContainer>
  )
}

export default Q19_Review
