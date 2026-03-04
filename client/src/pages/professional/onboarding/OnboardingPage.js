/* eslint-disable react/jsx-pascal-case */
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { useOnboardingState } from './hooks/useOnboardingState'
import SEOHelmet from '../../../components/analytics/SEOHelmet'

// Question components (simplified 7-step onboarding)
import Q1_NameAndProfession from './components/questions/Q1_NameAndProfession'
import Q2_PhotoUpload from './components/questions/Q2_PhotoUpload'
import Q3_Location from './components/questions/Q3_Location'
import Q4_SessionTypes from './components/questions/Q4_SessionTypes'
import Q5_Bio from './components/questions/Q5_Bio'
import Q6_ContactInfo from './components/questions/Q6_ContactInfo'
import Q20_Review from './components/questions/Q20_Review'

import '../../../assets/css/professional-signup.css'
import './onboarding.css'

const OnboardingPage = () => {
  const { user, profile, loading: authLoading } = useAuth()
  const onboardingState = useOnboardingState()
  const { currentStep, loading } = onboardingState

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/professional/signup" replace />
  }

  // Redirect to dashboard if profile is already completed
  if (!authLoading && profile?.onboarding_completed) {
    return <Navigate to="/professional/dashboard" replace />
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="professional-signup" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '1rem', color: 'var(--slate)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Render current question based on step
  const renderQuestion = () => {
    switch (currentStep) {
      case 1: return <Q1_NameAndProfession {...onboardingState} />
      case 2: return <Q2_PhotoUpload {...onboardingState} />
      case 3: return <Q3_Location {...onboardingState} />
      case 4: return <Q4_SessionTypes {...onboardingState} />
      case 5: return <Q5_Bio {...onboardingState} />
      case 6: return <Q6_ContactInfo {...onboardingState} />
      case 7: return <Q20_Review {...onboardingState} />
      default: return <Q1_NameAndProfession {...onboardingState} />
    }
  }

  return (
    <>
      <SEOHelmet
        title="Create Your Profile - Premarital Counseling Directory"
        description="Join our directory of premarital counselors and coaches. Help engaged couples find the right support for their relationship journey."
      />
      <div className="professional-signup onboarding-page">
        <div className="onboarding-bg-shape onboarding-bg-shape--one" aria-hidden="true" />
        <div className="onboarding-bg-shape onboarding-bg-shape--two" aria-hidden="true" />
        <div className="onboarding-bg-mesh" aria-hidden="true" />

        <div className="onboarding-shell">
          <section className="onboarding-main">
            <div className="signup-header">
              <h1>{currentStep > 1 ? 'Continue Your Profile' : 'Create Your Profile'}</h1>
            </div>

            {renderQuestion()}
          </section>
        </div>
      </div>
    </>
  )
}

export default OnboardingPage
