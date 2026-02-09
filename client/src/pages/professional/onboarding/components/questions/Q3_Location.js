import React, { useState } from 'react'
import QuestionContainer from '../QuestionContainer'
import { STATE_CONFIG } from '../../../../../data/locationConfig'

const Q3_Location = ({
  currentStep,
  profileData,
  updateField,
  saving,
  error,
  setError,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const [isOtherCity, setIsOtherCity] = useState(false)

  const handleContinue = async () => {
    // Validation
    if (!profileData.city?.trim()) {
      setError('Please enter your city')
      return
    }
    if (!profileData.state_province?.trim()) {
      setError('Please select your state')
      return
    }

    // Save and navigate
    await goToNextQuestion(currentStep)
  }

  const getCitiesForSelectedState = () => {
    if (!profileData.state_province) return []
    const stateEntry = Object.values(STATE_CONFIG).find(
      config => config.abbr === profileData.state_province
    )
    return stateEntry?.major_cities || []
  }

  const handleCitySelect = (value) => {
    if (value === '__other__') {
      setIsOtherCity(true)
      updateField('city', '')
    } else {
      setIsOtherCity(false)
      updateField('city', value)
    }
  }

  const handleStateChange = (value) => {
    updateField('state_province', value)
    updateField('city', '')
    setIsOtherCity(false)
  }

  const cities = getCitiesForSelectedState()

  return (
    <QuestionContainer
      currentStep={currentStep}
      saving={saving}
      error={error}
      onBack={goToPreviousQuestion}
      onContinue={handleContinue}
    >
      <div className="form-group">
        <label className="form-label">
          What state do you practice in?
        </label>
        <select
          className="form-select"
          value={profileData.state_province || ''}
          onChange={(e) => handleStateChange(e.target.value)}
          autoFocus
        >
          <option value="">Select state...</option>
          {Object.values(STATE_CONFIG).map((state) => (
            <option key={state.abbr} value={state.abbr}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {profileData.state_province && (
        <div className="form-group">
          <label className="form-label">
            What city?
          </label>
          {cities.length > 0 ? (
            <>
              <select
                className="form-select"
                value={isOtherCity ? '__other__' : profileData.city || ''}
                onChange={(e) => handleCitySelect(e.target.value)}
              >
                <option value="">Select city...</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
                <option value="__other__">Other city</option>
              </select>
              {isOtherCity && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your city"
                  value={profileData.city || ''}
                  onChange={(e) => updateField('city', e.target.value)}
                  style={{ marginTop: '0.75rem' }}
                  autoFocus
                />
              )}
            </>
          ) : (
            <input
              type="text"
              className="form-input"
              placeholder="Enter your city"
              value={profileData.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
            />
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">
          Street address (optional)
          <span className="form-label-subtitle">
            Only shown if you meet clients in person
          </span>
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="123 Main Street"
          value={profileData.address_line1 || ''}
          onChange={(e) => updateField('address_line1', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          ZIP code (optional)
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="12345"
          value={profileData.postal_code || ''}
          onChange={(e) => updateField('postal_code', e.target.value)}
          maxLength={10}
        />
      </div>
    </QuestionContainer>
  )
}

export default Q3_Location
