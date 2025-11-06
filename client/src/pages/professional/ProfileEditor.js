import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { profileOperations } from '../../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'

const ProfileEditor = () => {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
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
    country: 'United States'
  })
  
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const specialtyOptions = [
    'Premarital Counseling',
    'Couples Therapy', 
    'Marriage Counseling',
    'Conflict Resolution',
    'Communication Skills',
    'Financial Planning',
    'Intimacy & Sexuality',
    'Religious/Spiritual Counseling',
    'Interfaith Couples',
    'LGBTQ+ Affirmative',
    'Multicultural Relationships',
    'Blended Families',
    'PREPARE/ENRICH',
    'Gottman Method',
    'EFT (Emotionally Focused Therapy)',
    'SYMBIS Assessment'
  ]

  useEffect(() => {
    if (profile) {
      setFormData({
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
        country: profile.country || 'United States'
      })
      
      if (profile.photo_url) {
        setPhotoPreview(profile.photo_url)
      }
    }
  }, [profile])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const handleSpecialtyToggle = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          photo: 'Please select a valid image file'
        }))
        return
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({
          ...prev,
          photo: 'Image file must be smaller than 5MB'
        }))
        return
      }
      
      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target.result)
      }
      reader.readAsDataURL(file)
      
      // Clear photo error
      if (errors.photo) {
        setErrors(prev => ({
          ...prev,
          photo: null
        }))
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
      return
    }
    
    setLoading(true)
    setSaveSuccess(false)
    
    try {
      let photoUrl = profile?.photo_url
      
      // Upload photo if selected
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
      
      // Update profile data
      const updateData = {
        ...formData,
        photo_url: photoUrl,
        is_claimed: true
      }
      
      const { error } = await updateProfile(updateData)
      
      if (error) {
        throw new Error('Failed to save profile: ' + error.message)
      }
      
      setSaveSuccess(true)
      
      // Scroll to top to show success message
      window.scrollTo(0, 0)
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
      
    } catch (error) {
      console.error('Error saving profile:', error)
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }))
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
        <div className="alert alert-success">
          <i className="fa fa-check-circle" aria-hidden="true"></i>
          <div>
            <strong>Profile Updated Successfully!</strong>
            <p>Your changes have been saved and are now visible to couples searching for counseling.</p>
          </div>
        </div>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="alert alert-error">
          <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Photo Section */}
        <div className="form-section">
          <h2>Profile Photo</h2>
          <p>A professional photo helps couples connect with you</p>
          
          <div className="photo-upload">
            <div className="photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile preview" />
              ) : (
                <div className="photo-placeholder">
                  <i className="fa fa-user" aria-hidden="true"></i>
                </div>
              )}
            </div>
            
            <div className="photo-controls">
              <label className="btn btn-outline">
                <i className="fa fa-upload" aria-hidden="true"></i>
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </label>
              
              {photoPreview && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview('')
                  }}
                >
                  Remove Photo
                </button>
              )}
            </div>
            
            {errors.photo && (
              <div className="field-error">{errors.photo}</div>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="full_name">Full Name *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Dr. Sarah Mitchell"
                className={errors.full_name ? 'error' : ''}
              />
              {errors.full_name && (
                <div className="field-error">{errors.full_name}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="profession">Profession *</label>
              <select
                id="profession"
                name="profession"
                value={formData.profession}
                onChange={handleInputChange}
              >
                <option value="Therapist">Licensed Therapist</option>
                <option value="Marriage & Family Therapist">Marriage & Family Therapist</option>
                <option value="Coach">Certified Coach</option>
                <option value="Clergy">Clergy/Pastor</option>
                <option value="Clinical Social Worker">Licensed Clinical Social Worker</option>
                <option value="Psychologist">Licensed Psychologist</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && (
                <div className="field-error">{errors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        {/* Professional Bio */}
        <div className="form-section">
          <h2>Professional Bio</h2>
          <p>Tell couples about your approach and experience (minimum 50 characters)</p>
          
          <div className="form-group">
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Share your experience, approach to premarital counseling, and what makes you unique..."
              rows={6}
              className={errors.bio ? 'error' : ''}
            />
            <div className="character-count">
              {formData.bio.length} characters {formData.bio.length < 50 && '(minimum 50)'}
            </div>
            {errors.bio && (
              <div className="field-error">{errors.bio}</div>
            )}
          </div>
        </div>

        {/* Specialties */}
        <div className="form-section">
          <h2>Specialties & Services</h2>
          <p>Select all areas where you provide counseling services</p>
          
          <div className="specialty-grid">
            {specialtyOptions.map(specialty => (
              <label key={specialty} className="specialty-checkbox">
                <input
                  type="checkbox"
                  checked={formData.specialties.includes(specialty)}
                  onChange={() => handleSpecialtyToggle(specialty)}
                />
                <span className="checkmark"></span>
                {specialty}
              </label>
            ))}
          </div>
          
          {errors.specialties && (
            <div className="field-error">{errors.specialties}</div>
          )}
        </div>

        {/* Location */}
        <div className="form-section">
          <h2>Practice Location</h2>
          <p>Help couples find you by providing your practice location</p>
          
          <div className="form-group">
            <label htmlFor="address_line1">Street Address</label>
            <input
              type="text"
              id="address_line1"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleInputChange}
              placeholder="123 Main Street, Suite 100"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Austin"
                className={errors.city ? 'error' : ''}
              />
              {errors.city && (
                <div className="field-error">{errors.city}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="state_province">State/Province *</label>
              <input
                type="text"
                id="state_province"
                name="state_province"
                value={formData.state_province}
                onChange={handleInputChange}
                placeholder="Texas"
                className={errors.state_province ? 'error' : ''}
              />
              {errors.state_province && (
                <div className="field-error">{errors.state_province}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="postal_code">ZIP/Postal Code</label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                placeholder="73301"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <Link to="/professional/dashboard" className="btn btn-outline">
            Cancel
          </Link>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fa fa-save" aria-hidden="true"></i>
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfileEditor