/* eslint-disable react/jsx-pascal-case */
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { useOnboardingState } from './hooks/useOnboardingState'
import SEOHelmet from '../../../components/analytics/SEOHelmet'

// Question components
import Q1_NameAndProfession from './components/questions/Q1_NameAndProfession'
import Q2_PhotoUpload from './components/questions/Q2_PhotoUpload'
import Q3_Location from './components/questions/Q3_Location'
import Q4_SessionTypes from './components/questions/Q4_SessionTypes'
import Q5_Bio from './components/questions/Q5_Bio'
import Q6_ContactInfo from './components/questions/Q6_ContactInfo'
import Q7_FaithTradition from './components/questions/Q7_FaithTradition'
import Q8_Certifications from './components/questions/Q8_Certifications'
import Q9_Specialties from './components/questions/Q9_Specialties'
import Q10_TherapeuticApproach from './components/questions/Q10_TherapeuticApproach'
import Q11_ClientFocus from './components/questions/Q11_ClientFocus'
import Q12_ExperienceAndPronouns from './components/questions/Q12_ExperienceAndPronouns'
import Q13_Languages from './components/questions/Q13_Languages'
import Q14_LicenseAndCredentials from './components/questions/Q14_LicenseAndCredentials'
import Q15_Education from './components/questions/Q15_Education'
import Q16_SessionFees from './components/questions/Q16_SessionFees'
import Q17_Insurance from './components/questions/Q17_Insurance'
import Q18_PaymentMethods from './components/questions/Q18_PaymentMethods'
import Q19_FAQBuilder from './components/questions/Q20_FAQBuilder'
import Q20_Review from './components/questions/Q19_Review'

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
      case 7: return <Q7_FaithTradition {...onboardingState} />
      case 8: return <Q8_Certifications {...onboardingState} />
      case 9: return <Q9_Specialties {...onboardingState} />
      case 10: return <Q10_TherapeuticApproach {...onboardingState} />
      case 11: return <Q11_ClientFocus {...onboardingState} />
      case 12: return <Q12_ExperienceAndPronouns {...onboardingState} />
      case 13: return <Q13_Languages {...onboardingState} />
      case 14: return <Q14_LicenseAndCredentials {...onboardingState} />
      case 15: return <Q15_Education {...onboardingState} />
      case 16: return <Q16_SessionFees {...onboardingState} />
      case 17: return <Q17_Insurance {...onboardingState} />
      case 18: return <Q18_PaymentMethods {...onboardingState} />
      case 19: return <Q19_FAQBuilder {...onboardingState} />
      case 20: return <Q20_Review {...onboardingState} />
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
        <div className="signup-header">
          <h1>Create Your Professional Profile</h1>
          <p className="subtitle">
            Let's get you set up — we'll ask one question at a time
          </p>
        </div>

        {renderQuestion()}
      </div>
    </>
  )
}

export default OnboardingPage
