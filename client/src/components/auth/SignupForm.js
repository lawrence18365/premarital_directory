import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

const SignupForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    profession: 'Therapist',
    phone: '',
    agreeToTerms: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
      profession: formData.profession,
      phone: formData.phone
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Navigate to confirmation page after a delay
      setTimeout(() => {
        navigate('/professional/confirm-email')
      }, 3000)
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="success-icon">
              <i className="fa fa-check-circle" aria-hidden="true"></i>
            </div>
            <h2>Welcome to Our Directory! 🎉</h2>
            <p>We've sent a confirmation email to <strong>{formData.email}</strong></p>
            
            <div className="next-steps">
              <h3>What's Next?</h3>
              <ol>
                <li>Check your inbox and click the confirmation link</li>
                <li>Complete your professional profile</li>
                <li>Start receiving qualified leads from couples</li>
              </ol>
            </div>
          </div>
          <div className="auth-form">
            <Link to="/professional/login" className="btn btn-primary btn-full">
              Activate & Complete Profile
            </Link>
            <p className="text-center text-sm mt-3">
              <span>Didn't get the email? Check your spam folder or </span>
              <button onClick={() => setSuccess(false)} className="link-button">
                try again
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Join Our Professional Directory</h2>
          <p>Connect with couples actively seeking premarital counseling</p>
          
          <div className="signup-benefits">
            <div className="benefit">
              <i className="fa fa-users" aria-hidden="true"></i>
              <span>Connect with qualified leads</span>
            </div>
            <div className="benefit">
              <i className="fa fa-map-marker-alt" aria-hidden="true"></i>
              <span>Local SEO visibility</span>
            </div>
            <div className="benefit">
              <i className="fa fa-shield-alt" aria-hidden="true"></i>
              <span>Verified professional badge</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Dr. Sarah Mitchell"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="profession">Profession *</label>
              <select
                id="profession"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                required
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

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              autoComplete="tel"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a secure password"
                required
                minLength="6"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                minLength="6"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
              />
              <span className="checkmark"></span>
              I agree to the 
              <Link to="/terms" target="_blank" className="auth-link">Terms of Service</Link> 
              and 
              <Link to="/privacy" target="_blank" className="auth-link">Privacy Policy</Link>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? 
            <Link to="/professional/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupForm