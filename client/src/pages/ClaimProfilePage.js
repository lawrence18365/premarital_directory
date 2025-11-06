import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

import { profileOperations } from '../lib/supabaseClient'

const ClaimProfilePage = () => {
  const { id } = useParams() // Optional - for claiming specific profile
  const navigate = useNavigate()
  const [existingProfile, setExistingProfile] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    website: '',
    bio: '',
    profession: '',
    specialties: [],
    address_line1: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'United States'
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadExistingProfile()
    }
  }, [id])

  const loadExistingProfile = async () => {
    try {
      const { data, error } = await profileOperations.getProfile(id)
      if (data && !error) {
        setExistingProfile(data)
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          bio: data.bio || '',
          profession: data.profession || '',
          specialties: data.specialties || [],
          address_line1: data.address_line1 || '',
          city: data.city || '',
          state_province: data.state_province || '',
          postal_code: data.postal_code || '',
          country: data.country || 'United States'
        })
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSpecialtyToggle = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // This form should only be used for claiming existing profiles for now.
      if (!existingProfile) {
        alert("This form is for claiming existing profiles. Please contact us to create a new profile.");
        setLoading(false);
        return;
      }

      const claimData = {
        profile_id: existingProfile.id,
        submitted_by_email: formData.email,
        claim_data: formData,
        status: 'pending',
      };

      const { data, error } = await profileOperations.createProfileClaim(claimData);

      if (error) {
        throw error;
      }

      // Show success page
      setSubmitted(true);
      setLoading(false);

    } catch (err) {
      console.error('Error submitting claim:', err);
      alert('There was an error submitting your claim. Please try again.');
      setLoading(false);
    }
  };

  const professionOptions = [
    'Licensed Therapist',
    'Marriage & Family Therapist',
    'Licensed Clinical Social Worker',
    'Relationship Coach',
    'Life Coach',
    'Clergy/Pastor',
    'Chaplain',
    'Counselor'
  ]

  const specialtyOptions = [
    'Communication Skills',
    'Conflict Resolution',
    'Financial Planning',
    'Intimacy & Sexuality',
    'Family Planning',
    'Religious Counseling',
    'Emotional Intelligence',
    'Pre-Cana',
    'Christian Counseling',
    'Gottman Method',
    'EFT (Emotionally Focused Therapy)',
    'Prepare/Enrich',
    'SYMBIS Assessment',
    'Blended Families',
    'Interfaith Relationships',
    'LGBTQ+ Affirming',
    'Multicultural Counseling'
  ]

  if (submitted) {
    return (
      <div className="container" style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
        <SEOHelmet 
          title="Profile Created Successfully"
          description="Your profile is now live on Wedding Counselors. Couples can start finding you immediately."
          url="/claim-profile"
        />
        <div style={{ 
          background: 'var(--white)', 
          padding: 'var(--space-12)', 
          borderRadius: 'var(--radius-2xl)', 
          boxShadow: 'var(--shadow-xl)',
          maxWidth: '600px',
          margin: '0 auto',
          border: '1px solid var(--gray-200)'
        }}>
          <div style={{ 
            fontSize: 'var(--text-5xl)', 
            marginBottom: 'var(--space-4)',
            color: 'var(--success)'
          }}>
            <i className="fa fa-check-circle" aria-hidden="true"></i>
          </div>
          <h1>Claim Submitted!</h1>
          <p className="text-large text-secondary mb-8">
            Thank you for claiming your profile. Our team will review your submission within 24-48 hours.
          </p>
          <div style={{ 
            background: 'var(--gray-50)', 
            padding: 'var(--space-6)', 
            borderRadius: 'var(--radius-xl)', 
            marginBottom: 'var(--space-8)',
            border: '1px solid var(--gray-200)'
          }}>
            <h3>What happens next?</h3>
            <ul style={{ textAlign: 'left', color: 'var(--gray-600)', marginTop: 'var(--space-4)' }}>
              <li>✅ We will verify the information you submitted.</li>
              <li>✅ You will receive an email confirmation once your claim is approved.</li>
              <li>✅ Once approved, you will be able to manage your profile.</li>
            </ul>
          </div>
          <a href="/" className="btn btn-primary btn-large">Return to Directory</a>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <SEOHelmet 
        title={existingProfile ? 'Claim Your Profile' : 'Join Our Directory'}
        description={existingProfile ? 'Claim and manage your professional profile to connect with couples seeking premarital counseling.' : 'Join our directory to reach couples seeking premarital counseling and grow your practice.'}
        url="/claim-profile"
      />
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <h1>
            {existingProfile ? `Claim Your Profile` : 'Join Our Directory'}
          </h1>
          <p className="text-large text-secondary">
            {existingProfile 
              ? `Is this your profile? Claim it to manage your listing and connect with couples.`
              : `Connect with couples seeking premarital counseling by joining our professional directory.`
            }
          </p>
        </div>

        {/* Existing Profile Preview */}
        {existingProfile && (
          <div style={{ 
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
            border: '2px solid var(--accent)', 
            padding: 'var(--space-6)', 
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-8)'
          }}>
            <h3>Is this your profile?</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 'var(--space-4)' }}>
              <div>
                <div className="font-semibold text-dark">{existingProfile.full_name}</div>
                <div className="text-secondary">{existingProfile.profession}</div>
                <div className="text-muted">{existingProfile.city}, {existingProfile.state_province}</div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: 'var(--space-12)',
          gap: 'var(--space-4)'
        }}>
          {[1, 2, 3].map(step => (
            <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                background: currentStep >= step ? 'var(--primary)' : 'var(--gray-300)',
                color: currentStep >= step ? 'var(--white)' : 'var(--gray-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--font-weight-semibold)',
                transition: 'all var(--transition-normal)'
              }}>
                {step}
              </div>
              {step < 3 && (
                <div style={{
                  width: '60px',
                  height: '2px',
                  background: currentStep > step ? 'var(--primary)' : 'var(--gray-300)',
                  margin: '0 var(--space-4)',
                  transition: 'all var(--transition-normal)'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ 
          background: 'var(--white)', 
          padding: 'var(--space-8)', 
          borderRadius: 'var(--radius-2xl)', 
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--gray-200)'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div>
                <h2>Basic Information</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label htmlFor="full_name">Full Name *</label>
                    <input
                      type="text"
                      id="full_name"
                      className="form-control"
                      required
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profession">Profession *</label>
                    <select
                      id="profession"
                      className="form-control"
                      required
                      value={formData.profession}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                    >
                      <option value="">Select profession...</option>
                      {professionOptions.map(profession => (
                        <option key={profession} value={profession}>{profession}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      className="form-control"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    type="url"
                    id="website"
                    className="form-control"
                    placeholder="https://yourwebsite.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Professional Details */}
            {currentStep === 2 && (
              <div>
                <h2>Professional Details</h2>
                <div className="form-group">
                  <label htmlFor="bio">Professional Bio</label>
                  <textarea
                    id="bio"
                    className="form-control"
                    rows="5"
                    placeholder="Tell couples about your background, approach, and what makes you unique..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Specialties & Areas of Expertise</label>
                  <p className="text-small text-muted mb-4">
                    Select all that apply to help couples find the right fit.
                  </p>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: 'var(--space-3)' 
                  }}>
                    {specialtyOptions.map(specialty => (
                      <label key={specialty} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'background-color var(--transition-normal)'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-50)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={formData.specialties.includes(specialty)}
                          onChange={() => handleSpecialtyToggle(specialty)}
                          style={{ marginRight: 'var(--space-2)' }}
                        />
                        {specialty}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <div>
                <h2>Practice Location</h2>
                <div className="form-group">
                  <label htmlFor="address_line1">Address</label>
                  <input
                    type="text"
                    id="address_line1"
                    className="form-control"
                    value={formData.address_line1}
                    onChange={(e) => handleInputChange('address_line1', e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      className="form-control"
                      required
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state_province">State/Province *</label>
                    <input
                      type="text"
                      id="state_province"
                      className="form-control"
                      required
                      value={formData.state_province}
                      onChange={(e) => handleInputChange('state_province', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="postal_code">ZIP Code</label>
                    <input
                      type="text"
                      id="postal_code"
                      className="form-control"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: 'var(--space-8)',
              gap: 'var(--space-4)'
            }}>
              {currentStep > 1 ? (
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Next
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : (window.DEMO_MODE ? 'Submit Demo Claim' : 'Submit Profile Claim')}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Benefits Section */}
        <div style={{ 
          marginTop: 'var(--space-12)', 
          background: 'var(--gray-50)', 
          padding: 'var(--space-8)', 
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3>Why Join Our Directory?</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 'var(--space-6)', 
            marginTop: 'var(--space-4)' 
          }}>
            <div>
              <h4 style={{ color: 'var(--primary)' }}>Targeted Exposure</h4>
              <p className="text-small text-secondary">
                Connect with couples actively seeking premarital counseling services.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'var(--primary)' }}>Direct Leads</h4>
              <p className="text-small text-secondary">
                Receive contact requests directly from interested couples.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'var(--primary)' }}>Professional Credibility</h4>
              <p className="text-small text-secondary">
                Verified profiles build trust with potential clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClaimProfilePage
