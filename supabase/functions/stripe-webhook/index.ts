import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16'
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Webhook received:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string
          const profileId = session.metadata?.profile_id
          
          if (!profileId) {
            console.error('No profile_id in session metadata')
            break
          }

          // Get the subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscription.items.data[0].price.id

          // Find the matching plan in our database
          const { data: plan, error: planError } = await supabaseClient
            .from('subscription_plans')
            .select('*')
            .eq('stripe_price_id', priceId)
            .single()

          if (planError || !plan) {
            console.error('Plan not found for price:', priceId)
            break
          }

          // Create or update professional subscription
          const { error: subscriptionError } = await supabaseClient
            .from('professional_subscriptions')
            .upsert({
              profile_id: profileId,
              plan_id: plan.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              last_payment_at: new Date().toISOString(),
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
            })

          if (subscriptionError) {
            console.error('Error creating subscription:', subscriptionError)
            break
          }

          // Update profile with subscription plan
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({
              subscription_plan_id: plan.id,
              is_sponsored: plan.featured_placement || plan.premium_placement
            })
            .eq('id', profileId)

          if (profileError) {
            console.error('Error updating profile:', profileError)
          }

          console.log('Subscription created successfully for profile:', profileId)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Update last payment date
          const { error } = await supabaseClient
            .from('professional_subscriptions')
            .update({
              last_payment_at: new Date().toISOString(),
              status: 'active'
            })
            .eq('stripe_subscription_id', subscriptionId)

          if (error) {
            console.error('Error updating payment:', error)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Update subscription status
          const { error } = await supabaseClient
            .from('professional_subscriptions')
            .update({
              status: 'past_due'
            })
            .eq('stripe_subscription_id', subscriptionId)

          if (error) {
            console.error('Error updating failed payment:', error)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0].price.id

        // Get the new plan
        const { data: plan, error: planError } = await supabaseClient
          .from('subscription_plans')
          .select('*')
          .eq('stripe_price_id', priceId)
          .single()

        if (planError || !plan) {
          console.error('Plan not found for price:', priceId)
          break
        }

        // Update subscription
        const { data: updatedSubscription, error: updateError } = await supabaseClient
          .from('professional_subscriptions')
          .update({
            plan_id: plan.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
          .select('profile_id')
          .single()

        if (updateError || !updatedSubscription) {
          console.error('Error updating subscription:', updateError)
          break
        }

        // Update profile
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_plan_id: plan.id,
            is_sponsored: plan.featured_placement || plan.premium_placement
          })
          .eq('id', updatedSubscription.profile_id)

        if (profileError) {
          console.error('Error updating profile:', profileError)
        }

        console.log('Subscription updated for:', updatedSubscription.profile_id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Get free plan
        const { data: freePlan, error: freePlanError } = await supabaseClient
          .from('subscription_plans')
          .select('*')
          .eq('name', 'Free')
          .single()

        if (freePlanError || !freePlan) {
          console.error('Free plan not found')
          break
        }

        // Update subscription to canceled
        const { data: canceledSubscription, error: cancelError } = await supabaseClient
          .from('professional_subscriptions')
          .update({
            status: 'canceled'
          })
          .eq('stripe_subscription_id', subscription.id)
          .select('profile_id')
          .single()

        if (cancelError || !canceledSubscription) {
          console.error('Error canceling subscription:', cancelError)
          break
        }

        // Downgrade profile to free plan
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_plan_id: freePlan.id,
            is_sponsored: false
          })
          .eq('id', canceledSubscription.profile_id)

        if (profileError) {
          console.error('Error downgrading profile:', profileError)
        }

        console.log('Subscription canceled for:', canceledSubscription.profile_id)
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response('Webhook handled', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(`Webhook error: ${error.message}`, { status: 400 })
  }
})