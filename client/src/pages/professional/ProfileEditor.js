import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { profileOperations } from '../../lib/supabaseClient'
import { Link } from 'react-router-dom'

const ProfileEditor = () => {
  const { profile, updateProfile } = useAuth()
  
  const [formData, setFormData] = useState({
    // Basic fields
    full_name: '',
    email: '',
    phone: '',
    website: '',
    bio: '',
    profession: 'Therapist',
    specialties: [],
    address_line1: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'United States',
    
    // Enhanced SEO fields (new)
    certifications: [],
    faith_tradition: '',
    years_experience: '',
    treatment_approaches: [],
    client_focus: [],
    session_types: [],
    languages: [],
    insurance_accepted: [],
    payment_methods: [],
    offers_free_consultation: false,
    session_fee_min: '',
    session_fee_max: '',
    credentials: []
  })
  
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errors, setErrors] = useState({})
  const [activeSection, setActiveSection] = useState('basic')

  // Options matching CreateProfilePage
  const specialtyOptions = [
    // Core premarital topics
    'Communication Skills',
    'Conflict Resolution',
    'Financial Planning',
    'Intimacy & Sexuality',
    'Family Planning',
    // Relationship types
    'Blended Families',
    'Second Marriages',
    'Interfaith Couples',
    'Intercultural Couples',
    'Long-Distance Relationships',
    'Military Couples',
    'LGBTQ+ Affirming',
    // Special circumstances
    'Anxiety About Marriage',
    'In-Law Relationships',
    'Career/Work-Life Balance',
    'Trauma-Informed',
    // Faith-specific
    'Faith-Based Counseling',
    'Natural Family Planning (NFP)',
    'Catholic Marriage Prep'
  ]

  const certificationOptions = [
    'SYMBIS Certified',
    'PREPARE/ENRICH Certified',
    'Gottman Certified Therapist',
    'FOCCUS Trained',
    'Emotionally Focused (EFT) Certified',
    'Twogether in Texas Provider',
    'Pre-Cana Certified',
    'Marriage License Discount Provider'
  ]

  const faithTraditionOptions = [
    { value: 'secular', label: 'Secular/Non-religious' },
    { value: 'christian', label: 'Christian (Non-denominational)' },
    { value: 'catholic', label: 'Catholic' },
    { value: 'protestant', label: 'Protestant' },
    { value: 'jewish', label: 'Jewish' },
    { value: 'muslim', label: 'Muslim' },
    { value: 'interfaith', label: 'Interfaith Specialist' },
    { value: 'all-faiths', label: 'All Faiths Welcome' }
  ]

  const yearsOptions = [
    { value: '1', label: 'Less than 1 year' },
    { value: '3', label: '1-3 years' },
    { value: '5', label: '4-6 years' },
    { value: '10', label: '7-10 years' },
    { value: '15', label: '10-15 years' },
    { value: '20', label: '15+ years' }
  ]

  const treatmentApproachOptions = [
    'SYMBIS Assessment',
    'PREPARE/ENRICH',
    'FOCCUS Inventory',
    'Gottman Method',
    'Emotionally Focused (EFT)',
    'Cognitive Behavioral (CBT)',
    'Solution-Focused',
    'Attachment-Based',
    'Catholic Pre-Cana',
    'Faith-Based Counseling',
    'Twogether in Texas'
  ]

  const clientFocusOptions = [
    'Engaged Couples',
    'Newly Engaged',
    'Planning Wedding Soon',
    'Newlyweds (First Year)',
    'Young Adults (20s)',
    'Adults (30s-40s)',
    'Second Marriages',
    'Previously Divorced',
    'Blended Families',
    'LGBTQ+ Couples',
    'Interfaith Couples',
    'Intercultural Couples',
    'Military/First Responders',
    'Long-Distance Couples'
  ]

  const sessionTypeOptions = [
    { value: 'in-person', label: 'In-Person' },
    { value: 'online', label: 'Online/Video' },
    { value: 'hybrid', label: 'Both' }
  ]

  const languageOptions = [
    'English',
    'Spanish',
    'French',
    'German',
    'Mandarin',
    'Cantonese',
    'Korean',
    'Vietnamese',
    'Tagalog',
    'Arabic',
    'Hebrew',
    'Hindi',
    'Portuguese',
    'Russian',
    'Italian'
  ]

  const insuranceOptions = [
    'Aetna',
    'Blue Cross Blue Shield',
    'Cigna',
    'UnitedHealthcare',
    'Humana',
    'Kaiser Permanente',
    'Medicare',
    'Medicaid',
    'Out of Network',
    'Self-Pay Only'
  ]

  const paymentMethodOptions = [
    'Credit Card',
    'Cash',
    'Check',
    'HSA/FSA',
    'Sliding Scale'
  ]

  const professionOptions = [
    { value: 'Marriage & Family Therapist', label: 'Marriage & Family Therapist (LMFT)', category: 'licensed' },
    { value: 'Licensed Professional Counselor', label: 'Licensed Professional Counselor (LPC)', category: 'licensed' },
    { value: 'Licensed Clinical Social Worker', label: 'Licensed Clinical Social Worker (LCSW)', category: 'licensed' },
    { value: 'Psychologist', label: 'Psychologist (PhD/PsyD)', category: 'licensed' },
    { value: 'Premarital Coach', label: 'Premarital/Relationship Coach', category: 'coach' },
    { value: 'SYMBIS Facilitator', label: 'SYMBIS Facilitator', category: 'coach' },
    { value: 'Pastor', label: 'Pastor/Minister', category: 'clergy' },
    { value: 'Priest', label: 'Priest/Deacon', category: 'clergy' },
    { value: 'Rabbi', label: 'Rabbi', category: 'clergy' },
    { value: 'Chaplain', label: 'Chaplain', category: 'clergy' },
    { value: 'Pre-Cana Instructor', label: 'Pre-Cana Instructor', category: 'clergy' },
    { value: 'Wedding Officiant', label: 'Wedding Officiant (w/ Counseling)', category: 'other' }
  ]

  useEffect(() => {
    if (profile) {
      setFormData({
        // Basic fields
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        website: profile.website || '',
        bio: profile.bio || '',
        profession: profile.profession || 'Therapist',
        specialties: profile.specialties || [],
        address_line1: profile.address_line1 || '',
        city: profile.city || '',
        state_province: profile.state_province || '',
        postal_code: profile.postal_code || '',
        country: profile.country || 'United States',
        
        // Enhanced fields
        certifications: profile.certifications || [],
        faith_tradition: profile.faith_tradition || '',
        years_experience: profile.years_experience ? String(profile.years_experience) : '',
        treatment_approaches: profile.treatment_approaches || [],
        client_focus: profile.client_focus || [],
        session_types: profile.session_types || [],
        languages: profile.languages || [],
        insurance_accepted: profile.insurance_accepted || [],
        payment_methods: profile.payment_methods || [],
        offers_free_consultation: profile.offers_free_consultation || false,
        session_fee_min: profile.session_fee_min ? String(Math.round(profile.session_fee_min / 100)) : '',
        session_fee_max: profile.session_fee_max ? String(Math.round(profile.session_fee_max / 100)) : '',
        credentials: profile.credentials || []
      })
      
      if (profile.photo_url) {
        setPhotoPreview(profile.photo_url)
      }
    }
  }, [profile])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'Please select a valid image file' }))
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'Image file must be smaller than 5MB' }))
        return
      }
      
      setPhotoFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => setPhotoPreview(e.target.result)
      reader.readAsDataURL(file)
      
      if (errors.photo) {
        setErrors(prev => ({ ...prev, photo: null }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required'
    } else if (formData.bio.trim().length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters long'
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }
    
    if (!formData.state_province.trim()) {
      newErrors.state_province = 'State/Province is required'
    }
    
    if (formData.specialties.length === 0) {
      newErrors.specialties = 'Please select at least one specialty'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      window.scrollTo(0, 0)
      return
    }
    
    setLoading(true)
    setSaveSuccess(false)
    
    try {
      let photoUrl = profile?.photo_url
      
      if (photoFile) {
        const { data: uploadData, error: uploadError } = await profileOperations.uploadPhoto(
          photoFile, 
          profile.id
        )
        
        if (uploadError) {
          throw new Error('Failed to upload photo: ' + uploadError.message)
        }
        
        photoUrl = uploadData.publicUrl
      }
      
      // Build update data with proper transformations
      const updateData = {
        ...formData,
        photo_url: photoUrl,
        is_claimed: true,
        // Convert numeric fields
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        session_fee_min: formData.session_fee_min ? parseInt(formData.session_fee_min) * 100 : null,
        session_fee_max: formData.session_fee_max ? parseInt(formData.session_fee_max) * 100 : null,
        pricing_range: formData.session_fee_min && formData.session_fee_max
          ? `$${formData.session_fee_min}-$${formData.session_fee_max}`
          : null
      }
      
      const { error } = await updateProfile(updateData)
      
      if (error) {
        throw new Error('Failed to save profile: ' + error.message)
      }
      
      setSaveSuccess(true)
      window.scrollTo(0, 0)
      setTimeout(() => setSaveSuccess(false), 3000)
      
    } catch (error) {
      console.error('Error saving profile:', error)
      setErrors(prev => ({ ...prev, submit: error.message }))
      window.scrollTo(0, 0)
    }
    
    setLoading(false)
  }

  if (!profile) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  // Navigation tabs
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: 'fa-user' },
    { id: 'professional', label: 'Professional', icon: 'fa-briefcase' },
    { id: 'practice', label: 'Practice Details', icon: 'fa-building' },
    { id: 'seo', label: 'SEO & Visibility', icon: 'fa-search' }
  ]

  return (
    <div className="profile-editor">
      {/* Header */}
      <div className="editor-header">
        <Link to="/professional/dashboard" className="back-link">
          <i className="fa fa-arrow-left" aria-hidden="true"></i>
          Back to Dashboard
        </Link>
        
        <div className="header-content">
          <h1>Edit Your Profile</h1>
          <p>Keep your information up-to-date to attract more couples</p>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <i className="fa fa-check-circle" aria-hidden="true"></i>
          <div>
            <strong>Profile Updated Successfully!</strong>
            <p>Your changes have been saved and are now visible to couples searching for counseling.</p>
          </div>
        </div>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
          {errors.submit}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--gray-200)',
        paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: activeSection === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeSection === tab.id ? 'white' : 'var(--text-secondary)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <i className={`fa ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        {/* BASIC INFO SECTION */}
        {activeSection === 'basic' && (
          <>
            {/* Photo Section */}
            <div className="form-section">
              <h2>Profile Photo</h2>
              <p>A professional photo helps couples connect with you (3x more views!)</p>
              
              <div className="photo-upload" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div className="photo-preview" style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden' }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="photo-placeholder" style={{ width: '100%', height: '100%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa fa-user" style={{ fontSize: '3rem', color: 'var(--gray-400)' }}></i>
                    </div>
                  )}
                </div>
                
                <div className="photo-controls">
                  <label className="btn btn-outline">
                    <i className="fa fa-upload" aria-hidden="true"></i>
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                  </label>
                  
                  {photoPreview && (
                    <button type="button" className="btn btn-ghost" onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}>
                      Remove
                    </button>
                  )}
                  
                  {errors.photo && <div className="field-error">{errors.photo}</div>}
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Recommended: Professional headshot, 400x400px or larger
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name">Full Name *</label>
                  <input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="Dr. Sarah Mitchell" className={errors.full_name ? 'error' : ''} />
                  {errors.full_name && <div className="field-error">{errors.full_name}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="profession">Profession *</label>
                  <select id="profession" name="profession" value={formData.profession} onChange={handleInputChange}>
                    {professionOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="your.email@example.com" className={errors.email ? 'error' : ''} />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(555) 123-4567" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="website">Website</label>
                <input type="url" id="website" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://yourwebsite.com" />
              </div>
            </div>

            {/* Professional Bio */}
            <div className="form-section">
              <h2>Professional Bio *</h2>
              <p>Tell couples about your approach and experience. <strong>Minimum 50 characters, but 150+ recommended for SEO.</strong></p>
              
              <div className="form-group">
                <textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Share your experience, approach to premarital counseling, and what makes you unique..." rows={6} className={errors.bio ? 'error' : ''} />
                <div className="character-count" style={{ 
                  textAlign: 'right', 
                  fontSize: '0.85rem', 
                  marginTop: '0.5rem',
                  color: formData.bio.length < 50 ? 'var(--error)' : formData.bio.length < 150 ? 'var(--warning)' : 'var(--success)'
                }}>
                  {formData.bio.length} characters 
                  {formData.bio.length < 50 && '(minimum 50)'}
                  {formData.bio.length >= 50 && formData.bio.length < 150 && '(150+ recommended for SEO)'}
                  {formData.bio.length >= 150 && '✓ Great for SEO!'}
                </div>
                {errors.bio && <div className="field-error">{errors.bio}</div>}
              </div>
            </div>
          </>
        )}

        {/* PROFESSIONAL SECTION */}
        {activeSection === 'professional' && (
          <>
            {/* Faith Tradition */}
            <div className="form-section">
              <h2>Faith Tradition</h2>
              <p>Many couples specifically search for counselors who share their faith background. This is a key differentiator.</p>
              
              <div className="form-group">
                <label htmlFor="faith_tradition">Your Faith Tradition</label>
                <select id="faith_tradition" name="faith_tradition" value={formData.faith_tradition} onChange={handleInputChange}>
                  <option value="">Select your faith tradition...</option>
                  {faithTraditionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Years of Experience */}
            <div className="form-section">
              <h2>Experience</h2>
              
              <div className="form-group">
                <label htmlFor="years_experience">Years of Experience</label>
                <select id="years_experience" name="years_experience" value={formData.years_experience} onChange={handleInputChange}>
                  <option value="">Select years of experience...</option>
                  {yearsOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Certifications */}
            <div className="form-section">
              <h2>Certifications & Training</h2>
              <p>Select all certifications you hold. These build credibility and help with search matching.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
                {certificationOptions.map(cert => (
                  <label key={cert} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', borderRadius: '6px', ':hover': { background: 'var(--gray-50)' } }}>
                    <input type="checkbox" checked={formData.certifications.includes(cert)} onChange={() => handleArrayToggle('certifications', cert)} />
                    <span style={{ fontSize: '0.9rem' }}>{cert}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Treatment Approaches */}
            <div className="form-section">
              <h2>Treatment Approaches</h2>
              <p>Select the methods and assessments you use in your practice.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {treatmentApproachOptions.map(approach => (
                  <label key={approach} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.treatment_approaches.includes(approach)} onChange={() => handleArrayToggle('treatment_approaches', approach)} />
                    <span style={{ fontSize: '0.9rem' }}>{approach}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div className="form-section">
              <h2>Specialties & Services *</h2>
              <p>Select all areas where you provide counseling services. <strong>3+ recommended for better matching.</strong></p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {specialtyOptions.map(specialty => (
                  <label key={specialty} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.specialties.includes(specialty)} onChange={() => handleArrayToggle('specialties', specialty)} />
                    <span style={{ fontSize: '0.9rem' }}>{specialty}</span>
                  </label>
                ))}
              </div>
              {errors.specialties && <div className="field-error">{errors.specialties}</div>}
            </div>

            {/* Client Focus */}
            <div className="form-section">
              <h2>Client Focus</h2>
              <p>Who do you work best with? Select all that apply.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {clientFocusOptions.map(focus => (
                  <label key={focus} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.client_focus.includes(focus)} onChange={() => handleArrayToggle('client_focus', focus)} />
                    <span style={{ fontSize: '0.9rem' }}>{focus}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* PRACTICE DETAILS SECTION */}
        {activeSection === 'practice' && (
          <>
            {/* Location */}
            <div className="form-section">
              <h2>Practice Location</h2>
              <p>Help couples find you by providing your practice location</p>
              
              <div className="form-group">
                <label htmlFor="address_line1">Street Address</label>
                <input type="text" id="address_line1" name="address_line1" value={formData.address_line1} onChange={handleInputChange} placeholder="123 Main Street, Suite 100" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="Austin" className={errors.city ? 'error' : ''} />
                  {errors.city && <div className="field-error">{errors.city}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="state_province">State/Province *</label>
                  <input type="text" id="state_province" name="state_province" value={formData.state_province} onChange={handleInputChange} placeholder="Texas" className={errors.state_province ? 'error' : ''} />
                  {errors.state_province && <div className="field-error">{errors.state_province}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="postal_code">ZIP/Postal Code</label>
                  <input type="text" id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleInputChange} placeholder="73301" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <select id="country" name="country" value={formData.country} onChange={handleInputChange}>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>

            {/* Session Types */}
            <div className="form-section">
              <h2>Session Types</h2>
              <p>How do you meet with clients?</p>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {sessionTypeOptions.map(option => (
                  <label key={option.value} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.75rem 1rem',
                    border: `2px solid ${formData.session_types.includes(option.value) ? 'var(--color-primary)' : 'var(--gray-200)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: formData.session_types.includes(option.value) ? 'var(--primary-light)' : 'white'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={formData.session_types.includes(option.value)} 
                      onChange={() => handleArrayToggle('session_types', option.value)} 
                    />
                    <i className={`fa ${option.icon}`} style={{ color: 'var(--color-primary)' }}></i>
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="form-section">
              <h2>Languages Spoken</h2>
              <p>Select all languages you can provide counseling in.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                {languageOptions.map(lang => (
                  <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.languages.includes(lang)} onChange={() => handleArrayToggle('languages', lang)} />
                    <span style={{ fontSize: '0.9rem' }}>{lang}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* SEO & VISIBILITY SECTION */}
        {activeSection === 'seo' && (
          <>
            {/* Pricing */}
            <div className="form-section">
              <h2>Pricing Information</h2>
              <p>Transparent pricing helps couples make informed decisions and reduces unnecessary inquiries.</p>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="offers_free_consultation" checked={formData.offers_free_consultation} onChange={handleInputChange} />
                  <span>I offer a free initial consultation</span>
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="session_fee_min">Minimum Session Fee ($)</label>
                  <input type="number" id="session_fee_min" name="session_fee_min" value={formData.session_fee_min} onChange={handleInputChange} placeholder="100" min="0" />
                </div>

                <div className="form-group">
                  <label htmlFor="session_fee_max">Maximum Session Fee ($)</label>
                  <input type="number" id="session_fee_max" name="session_fee_max" value={formData.session_fee_max} onChange={handleInputChange} placeholder="200" min="0" />
                </div>
              </div>

              {formData.session_fee_min && formData.session_fee_max && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Displayed as: <strong>${formData.session_fee_min}-${formData.session_fee_max}</strong>
                </p>
              )}
            </div>

            {/* Insurance */}
            <div className="form-section">
              <h2>Insurance Accepted</h2>
              <p>Select all insurance providers you accept, or choose "Self-Pay Only" if you don't take insurance.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {insuranceOptions.map(ins => (
                  <label key={ins} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.insurance_accepted.includes(ins)} onChange={() => handleArrayToggle('insurance_accepted', ins)} />
                    <span style={{ fontSize: '0.9rem' }}>{ins}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="form-section">
              <h2>Payment Methods</h2>
              <p>Select all payment methods you accept.</p>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {paymentMethodOptions.map(method => (
                  <label key={method} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.5rem 1rem',
                    border: `2px solid ${formData.payment_methods.includes(method) ? 'var(--color-primary)' : 'var(--gray-200)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: formData.payment_methods.includes(method) ? 'var(--primary-light)' : 'white'
                  }}>
                    <input type="checkbox" checked={formData.payment_methods.includes(method)} onChange={() => handleArrayToggle('payment_methods', method)} />
                    <span style={{ fontSize: '0.9rem' }}>{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* SEO Tips */}
            <div className="form-section" style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ color: '#166534', marginBottom: '1rem' }}>
                <i className="fa fa-search" style={{ marginRight: '0.5rem' }}></i>
                SEO Tips for Better Visibility
              </h2>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
                <li style={{ marginBottom: '0.5rem' }}><strong>Bio:</strong> Write 150+ words including keywords like "premarital counseling," your city name, and specialties</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Photo:</strong> Profiles with photos get 3x more views</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Specialties:</strong> Select at least 3 to appear in more searches</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Faith Tradition:</strong> Many couples specifically search by this</li>
                <li><strong>Pricing:</strong> Transparent pricing builds trust and attracts serious inquiries</li>
              </ul>
            </div>
          </>
        )}

        {/* Form Actions */}
        <div className="form-actions" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '1.5rem',
          background: 'var(--gray-50)',
          borderRadius: '12px',
          marginTop: '2rem'
        }}>
          <Link to="/professional/dashboard" className="btn btn-outline">
            Cancel
          </Link>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {saveSuccess && (
              <span style={{ color: 'var(--success)', fontWeight: '500' }}>
                <i className="fa fa-check" style={{ marginRight: '0.5rem' }}></i>
                Saved!
              </span>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '150px' }}>
              {loading ? (
                <><i className="fa fa-spinner fa-spin"></i> Saving...</>
              ) : (
                <><i className="fa fa-save"></i> Save Profile</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ProfileEditor
