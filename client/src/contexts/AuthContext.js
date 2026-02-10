import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})
const INITIAL_AUTH_TIMEOUT_MS = 8000
const SESSION_DATA_TIMEOUT_MS = 8000

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

  useEffect(() => {
    let isMounted = true
    let hasResolvedInitialSession = false
    let activeSessionRequest = 0

    const handleSession = async (session) => {
      const requestId = ++activeSessionRequest
      if (!isMounted) return
      setUser(session?.user || null)
      if (session?.user) {
        try {
          await Promise.all([
            withTimeout(loadUserProfile(session.user.id), SESSION_DATA_TIMEOUT_MS, 'loadUserProfile'),
            withTimeout(checkAdminStatus(session.user.id), SESSION_DATA_TIMEOUT_MS, 'checkAdminStatus')
          ])
        } catch (err) {
          console.error('Error loading user data:', err)
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
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        setProfile(null)
        return
      }

      if (!profileData) {
        console.log('No profile found for user:', userId)
        setProfile(null)
        return
      }

      setProfile(profileData)
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

  const signUp = async (email, password, profileData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: profileData,
        emailRedirectTo: `${window.location.origin}/professional/email-verified`
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
        .select()

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
        .select()

      if (error) throw error

      // Update local profile state
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

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    claimProfile,
    updateProfile,
    resetPassword,
    updatePassword,
    refreshProfile: () => loadUserProfile(user?.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
