import React, { createContext, useContext, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabaseClient'

const StripeContext = createContext({})

// Initialize Stripe - gracefully handle missing key for development
const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null)

export const useStripe = () => {
  const context = useContext(StripeContext)
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider')
  }
  return context
}

export const StripeProvider = ({ children }) => {
  const [loading, setLoading] = useState(false)

  // Create a subscription checkout session
  const createCheckoutSession = async (priceId, profileId) => {
    setLoading(true)
    
    try {
      // Check if Stripe is configured
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe is not configured. Please add REACT_APP_STRIPE_PUBLISHABLE_KEY to your environment.')
      }

      // Call your Supabase Edge Function or backend to create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          profileId,
          successUrl: `${window.location.origin}/professional/subscription/success`,
          cancelUrl: `${window.location.origin}/professional/subscription`
        }
      })

      if (error) throw error

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      })

      if (stripeError) throw stripeError

    } catch (error) {
      console.error('Error creating checkout session:', error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Create customer portal session for subscription management
  const createPortalSession = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: `${window.location.origin}/professional/subscription`
        }
      })

      if (error) throw error

      window.location.href = data.url

    } catch (error) {
      console.error('Error creating portal session:', error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Get subscription plans
  const getSubscriptionPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true })

    return { data, error }
  }

  // Get current subscription status
  const getCurrentSubscription = async (profileId) => {
    const { data, error } = await supabase
      .from('professional_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('profile_id', profileId)
      .eq('status', 'active')
      .single()

    return { data, error }
  }

  const value = {
    loading,
    createCheckoutSession,
    createPortalSession,
    getSubscriptionPlans,
    getCurrentSubscription,
    stripePromise
  }

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  )
}

export default StripeContext