import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      if (session?.user) {
        loadUserProfile(session.user.id)
        checkAdminStatus(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          await loadUserProfile(session.user.id)
          await checkAdminStatus(session.user.id)
        } else {
          setProfile(null)
          setIsAdmin(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      // Simple query first - avoid complex joins that might fail
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found - this is expected for new users
          console.log('No profile found for user:', userId)
        } else {
          console.error('Error loading profile:', profileError)
        }
        return
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
    }
  }

  const checkAdminStatus = async (userId) => {
    try {
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single()

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
