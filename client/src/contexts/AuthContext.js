import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { PROFILE_SELECT_COLUMNS } from '../lib/profileSelectColumns'

const AuthContext = createContext({})
const INITIAL_AUTH_TIMEOUT_MS = 15000
const SESSION_DATA_TIMEOUT_MS = 15000
const PROFILE_LOAD_RETRIES = 2

const withTimeout = (promise, timeoutMs, label) => {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId))
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profileLoadFailed, setProfileLoadFailed] = useState(false)

  useEffect(() => {
    let isMounted = true
    let hasResolvedInitialSession = false
    let activeSessionRequest = 0

    const handleSession = async (session) => {
      const requestId = ++activeSessionRequest
      if (!isMounted) return

      // IMPORTANT: Set loading=true BEFORE setting user when there's a session.
      // This prevents a race condition where the dashboard sees user!=null but
      // profile==null (still loading) and incorrectly redirects to onboarding.
      // React 18 batches these updates so the component sees both atomically.
      if (session?.user) {
        setLoading(true)
      }

      setUser(session?.user || null)
      setProfileLoadFailed(false)
      if (session?.user) {
        let profileLoaded = false
        for (let attempt = 0; attempt <= PROFILE_LOAD_RETRIES; attempt++) {
          try {
            await Promise.all([
              withTimeout(loadUserProfile(session.user.id), SESSION_DATA_TIMEOUT_MS, 'loadUserProfile'),
              withTimeout(checkAdminStatus(session.user.id), SESSION_DATA_TIMEOUT_MS, 'checkAdminStatus')
            ])
            profileLoaded = true
            break
          } catch (err) {
            console.error(`Error loading user data (attempt ${attempt + 1}):`, err)
            if (attempt < PROFILE_LOAD_RETRIES) {
              await new Promise(r => setTimeout(r, 1000))
            }
          }
        }
        if (!profileLoaded && isMounted) {
          setProfileLoadFailed(true)
        }
      } else {
        setProfile(null)
        setIsAdmin(false)
      }
      if (isMounted && requestId === activeSessionRequest) {
        setLoading(false)
      }
    }

    // Listen for auth changes (INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!hasResolvedInitialSession) {
          hasResolvedInitialSession = true
        }
        handleSession(session)
      }
    )

    // Fallback for environments where INITIAL_SESSION may not fire.
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted || hasResolvedInitialSession) return
        hasResolvedInitialSession = true
        handleSession(session)
      })
      .catch((error) => {
        console.error('Error getting initial session:', error)
        if (!isMounted || hasResolvedInitialSession) return
        hasResolvedInitialSession = true
        setLoading(false)
      })

    const initialSessionTimeout = setTimeout(() => {
      if (!isMounted || hasResolvedInitialSession) return
      console.warn(`Auth initialization timed out after ${INITIAL_AUTH_TIMEOUT_MS}ms`)
      hasResolvedInitialSession = true
      setLoading(false)
    }, INITIAL_AUTH_TIMEOUT_MS)

    return () => {
      isMounted = false
      clearTimeout(initialSessionTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      // Simple query first - avoid complex joins that might fail
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT_COLUMNS)
        .eq('user_id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        setProfile(null)
        return
      }

      if (profileData) {
        setProfile(profileData)
        return
      }

      // No profile found by user_id — check for a claimed profile with matching
      // email that was never linked (e.g. admin approved claim without setting user_id)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser?.email) {
        const { data: unlinkedProfile, error: unlinkedError } = await supabase
          .from('profiles')
          .select(PROFILE_SELECT_COLUMNS)
          .is('user_id', null)
          .ilike('email', authUser.email)
          .maybeSingle()

        if (!unlinkedError && unlinkedProfile) {
          // Auto-link: set user_id on the orphaned/unclaimed profile
          // (RLS policy "Users can claim unclaimed profiles matching their email" allows this)
          const { data: linkedProfile, error: linkError } = await supabase
            .from('profiles')
            .update({ 
              user_id: userId, 
              is_claimed: true,
              claimed_at: new Date().toISOString(),
              last_login: new Date().toISOString() 
            })
            .eq('id', unlinkedProfile.id)
            .is('user_id', null)
            .select(PROFILE_SELECT_COLUMNS)
            .single()

          if (!linkError && linkedProfile) {
            console.log('Auto-linked orphaned claimed profile to user:', userId)
            setProfile(linkedProfile)
            return
          } else {
            console.warn('Failed to auto-link profile:', linkError?.message)
          }
        }
      }

      console.log('No profile found for user:', userId)
      setProfile(null)
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
      setProfile(null)
    }
  }

  const checkAdminStatus = async (userId) => {
    try {
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .maybeSingle()

      if (!error && adminData) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      setIsAdmin(false)
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    return { data, error }
  }

  const signUp = async (email, password, profileData = {}, redirectTo = null) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: profileData,
        emailRedirectTo: redirectTo || `${window.location.origin}/professional/email-verified`
      }
    })

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const claimProfile = async (profileId, userData) => {
    try {
      // Update the profile to link it to the current user
      const { data, error } = await supabase
        .from('profiles')
        .update({
          user_id: user.id,
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          email: user.email,
          last_login: new Date().toISOString(),
          ...userData
        })
        .eq('id', profileId)
        .select('id')

      if (error) throw error

      // Reload profile to get updated data
      await loadUserProfile(user.id)

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const updateProfile = async (updates) => {
    if (!profile) return { data: null, error: new Error('No profile found') }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          last_login: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select('id')

      if (error) throw error

      // Verify rows were actually updated — RLS may silently block writes
      if (!data || data.length === 0) {
        throw new Error(
          'Unable to save changes. Your profile may not be linked to your account. ' +
          'Please contact support at hello@weddingcounselors.com for assistance.'
        )
      }

      // Update local profile state only after confirmed write
      setProfile(prev => ({ ...prev, ...updates }))

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    return { data, error }
  }

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    return { data, error }
  }

  const retryProfileLoad = async () => {
    if (!user) return
    setLoading(true)
    setProfileLoadFailed(false)
    try {
      await Promise.all([
        withTimeout(loadUserProfile(user.id), SESSION_DATA_TIMEOUT_MS, 'loadUserProfile'),
        withTimeout(checkAdminStatus(user.id), SESSION_DATA_TIMEOUT_MS, 'checkAdminStatus')
      ])
    } catch (err) {
      console.error('Error retrying profile load:', err)
      setProfileLoadFailed(true)
    }
    setLoading(false)
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    profileLoadFailed,
    signIn,
    signUp,
    signOut,
    claimProfile,
    updateProfile,
    resetPassword,
    updatePassword,
    refreshProfile: () => loadUserProfile(user?.id),
    retryProfileLoad
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
