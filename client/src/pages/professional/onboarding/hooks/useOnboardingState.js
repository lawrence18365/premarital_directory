import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../../contexts/AuthContext'
import { supabase } from '../../../../lib/supabaseClient'

/**
 * Custom hook for managing onboarding state, auto-save, and navigation
 * Handles loading profile data, updating fields, saving progress, and resuming
 */
export const useOnboardingState = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, refreshProfile } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [profileData, setProfileData] = useState({
    // Core identity fields
    full_name: '',
    profession: '',
    photo_url: '',

    // Location
    city: '',
    state_province: '',
    address_line1: '',
    postal_code: '',
    country: 'United States',

    // Session types
    session_types: [],

    // Bio (structured)
    bio: '',
    bio_approach: '',
    bio_ideal_client: '',
    bio_outcomes: '',

    // Contact
    phone: '',
    website: '',

    // Optional fields
    faith_tradition: '',
    certifications: [],
    specialties: [],
    treatment_approaches: [],
    client_focus: [],
    years_experience: '',
    pronouns: '',
    languages: [],
    credentials: [],
    education: [],

    // Pricing
    offers_free_consultation: false,
    sliding_scale: false,
    session_fee_min: '',
    session_fee_max: '',
    insurance_accepted: [],
    payment_methods: [],

    // FAQs
    faqs: [],

    // Meta
    email: ''
  })

  const [profileId, setProfileId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')

  // UTM tracking
  const [utmParams, setUtmParams] = useState({})

  // Capture UTM parameters on mount
  useEffect(() => {
    const params = {
      utm_source: searchParams.get('utm_source') || '',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
      signup_source: searchParams.get('source') || 'organic'
    }
    setUtmParams(params)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing profile data or create draft on mount
  useEffect(() => {
    const initializeOnboarding = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        // Check if user already has a profile
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (fetchError) throw fetchError

        if (existingProfile) {
          // Profile exists - load it for resume
          setProfileId(existingProfile.id)
          setProfileData({
            full_name: existingProfile.full_name || '',
            profession: existingProfile.profession || '',
            photo_url: existingProfile.photo_url || '',
            city: existingProfile.city || '',
            state_province: existingProfile.state_province || '',
            address_line1: existingProfile.address_line1 || '',
            postal_code: existingProfile.postal_code || '',
            country: existingProfile.country || 'United States',
            session_types: existingProfile.session_types || [],
            bio: existingProfile.bio || '',
            bio_approach: existingProfile.bio_approach || '',
            bio_ideal_client: existingProfile.bio_ideal_client || '',
            bio_outcomes: existingProfile.bio_outcomes || '',
            phone: existingProfile.phone || '',
            website: existingProfile.website || '',
            faith_tradition: existingProfile.faith_tradition || '',
            certifications: existingProfile.certifications || [],
            specialties: existingProfile.specialties || [],
            treatment_approaches: existingProfile.treatment_approaches || [],
            client_focus: existingProfile.client_focus || [],
            years_experience: existingProfile.years_experience?.toString() || '',
            pronouns: existingProfile.pronouns || '',
            languages: existingProfile.languages || [],
            credentials: existingProfile.credentials || [],
            education: existingProfile.education || [],
            offers_free_consultation: existingProfile.offers_free_consultation || false,
            sliding_scale: existingProfile.sliding_scale || false,
            session_fee_min: existingProfile.session_fee_min ? (existingProfile.session_fee_min / 100).toString() : '',
            session_fee_max: existingProfile.session_fee_max ? (existingProfile.session_fee_max / 100).toString() : '',
            insurance_accepted: existingProfile.insurance_accepted || [],
            payment_methods: existingProfile.payment_methods || [],
            faqs: existingProfile.faqs || [],
            email: existingProfile.email || user.email
          })

          if (existingProfile.photo_url) {
            setPhotoPreview(existingProfile.photo_url)
          }

          // Resume from last saved step
          const resumeStep = existingProfile.onboarding_step || 1
          setCurrentStep(resumeStep)

          // Update URL to reflect current step
          const newParams = new URLSearchParams(searchParams)
          newParams.set('step', resumeStep.toString())
          setSearchParams(newParams, { replace: true })
        } else {
          // No profile - create draft profile
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              email: user.email,
              full_name: '',
              onboarding_step: 1,
              onboarding_completed: false,
              onboarding_started_at: new Date().toISOString(),
              onboarding_last_saved_at: new Date().toISOString(),
              moderation_status: 'draft', // Hidden until completion
              country: 'United States',
              tier: 'community',
              signup_source: utmParams.signup_source || 'organic',
              utm_source: utmParams.utm_source || null,
              utm_medium: utmParams.utm_medium || null,
              utm_campaign: utmParams.utm_campaign || null
            })
            .select()
            .single()

          if (createError) {
            // Duplicate key — profile was created between our check and insert (race condition)
            if (createError.code === '23505') {
              const { data: raceProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()
              if (raceProfile) {
                setProfileId(raceProfile.id)
                setProfileData(prev => ({ ...prev, email: user.email }))
                return
              }
            }
            throw createError
          }

          setProfileId(newProfile.id)
          setProfileData(prev => ({ ...prev, email: user.email }))
        }
      } catch (err) {
        console.error('Error initializing onboarding:', err)
        setError('Failed to load onboarding. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    initializeOnboarding()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update field value
  const updateField = useCallback((field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    setError('')
  }, [])

  // Handle array toggle (for multi-select fields)
  const toggleArrayField = useCallback((field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
    setError('')
  }, [])

  // Save current progress to database
  const saveProgress = useCallback(async (step) => {
    if (!profileId || !user) return { success: false }

    setSaving(true)
    setError('')

    try {
      const updateData = {
        full_name: profileData.full_name.trim() || null,
        profession: profileData.profession || null,
        city: profileData.city.trim() || null,
        state_province: profileData.state_province.trim() || null,
        address_line1: profileData.address_line1.trim() || null,
        postal_code: profileData.postal_code.trim() || null,
        session_types: profileData.session_types.length > 0 ? profileData.session_types : null,
        bio: profileData.bio.trim() || null,
        bio_approach: profileData.bio_approach?.trim() || null,
        bio_ideal_client: profileData.bio_ideal_client?.trim() || null,
        bio_outcomes: profileData.bio_outcomes?.trim() || null,
        phone: profileData.phone.trim() || null,
        website: profileData.website.trim() || null,
        faith_tradition: profileData.faith_tradition || null,
        certifications: profileData.certifications.length > 0 ? profileData.certifications : null,
        specialties: profileData.specialties.length > 0 ? profileData.specialties : null,
        treatment_approaches: profileData.treatment_approaches.length > 0 ? profileData.treatment_approaches : null,
        client_focus: profileData.client_focus.length > 0 ? profileData.client_focus : null,
        years_experience: profileData.years_experience ? parseInt(profileData.years_experience) : null,
        pronouns: profileData.pronouns || null,
        languages: profileData.languages.length > 0 ? profileData.languages : null,
        credentials: profileData.credentials.length > 0 ? profileData.credentials : null,
        education: profileData.education.length > 0 ? profileData.education : null,
        offers_free_consultation: profileData.offers_free_consultation,
        sliding_scale: profileData.sliding_scale,
        session_fee_min: profileData.session_fee_min ? parseInt(profileData.session_fee_min) * 100 : null,
        session_fee_max: profileData.session_fee_max ? parseInt(profileData.session_fee_max) * 100 : null,
        pricing_range: profileData.session_fee_min
          ? profileData.session_fee_max
            ? `$${profileData.session_fee_min}-$${profileData.session_fee_max}`
            : `$${profileData.session_fee_min}`
          : null,
        insurance_accepted: profileData.insurance_accepted.length > 0 ? profileData.insurance_accepted : null,
        payment_methods: profileData.payment_methods.length > 0 ? profileData.payment_methods : null,
        faqs: profileData.faqs && profileData.faqs.length > 0 ? profileData.faqs : null,
        onboarding_step: step,
        onboarding_last_saved_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)

      if (updateError) throw updateError

      // Also cache to sessionStorage as backup
      sessionStorage.setItem('onboarding_backup', JSON.stringify({
        step,
        data: profileData,
        timestamp: Date.now()
      }))

      return { success: true }
    } catch (err) {
      console.error('Error saving progress:', err)
      setError('Failed to save progress. Please try again.')
      return { success: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [profileId, profileData, user])

  // Navigate to next question
  const goToNextQuestion = useCallback(async (fromStep) => {
    // Save progress before moving to next step
    const result = await saveProgress(fromStep + 1)
    if (!result.success) return false

    setCurrentStep(fromStep + 1)

    // Update URL parameter
    const newParams = new URLSearchParams(searchParams)
    newParams.set('step', (fromStep + 1).toString())
    setSearchParams(newParams, { replace: true })

    window.scrollTo({ top: 0, behavior: 'smooth' })
    return true
  }, [saveProgress, searchParams, setSearchParams])

  // Navigate to previous question
  const goToPreviousQuestion = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)

      // Update URL parameter
      const newParams = new URLSearchParams(searchParams)
      newParams.set('step', (currentStep - 1).toString())
      setSearchParams(newParams, { replace: true })

      setError('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, searchParams, setSearchParams])

  return {
    // State
    currentStep,
    profileData,
    profileId,
    loading,
    saving,
    error,
    photoFile,
    photoPreview,
    utmParams,

    // Actions
    updateField,
    toggleArrayField,
    setPhotoFile,
    setPhotoPreview,
    setError,
    saveProgress,
    goToNextQuestion,
    goToPreviousQuestion,

    // Auth
    user,
    refreshProfile,
    navigate
  }
}
