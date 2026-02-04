import { supabase } from './supabaseClient'

/**
 * Email Notification Helpers
 *
 * Uses Supabase Edge Functions to keep API keys off the client.
 */

/**
 * Generic email sender using the send-email edge function
 */
const sendEmail = async (to, subject, template, data) => {
  const { data: result, error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, template, data }
  })

  if (error || !result?.success) {
    throw new Error(result?.error || error?.message || 'Email send failed')
  }

  return result
}

/**
 * Send email when a profile is approved by admin
 */
export const sendProfileApprovedEmail = async (email, profileData) => {
  const stateSlug = profileData.state_province?.toLowerCase().replace(/\s+/g, '-') || ''
  const citySlug = profileData.city?.toLowerCase().replace(/\s+/g, '-') || ''
  const profileSlug = profileData.slug || profileData.id

  return sendEmail(
    email,
    'Your Profile is Live on Wedding Counselors!',
    'profile_approved',
    {
      name: profileData.full_name,
      city: profileData.city,
      state: profileData.state_province,
      profileUrl: `https://www.weddingcounselors.com/premarital-counseling/${stateSlug}/${citySlug}/${profileSlug}`,
      dashboardUrl: 'https://www.weddingcounselors.com/professional/dashboard'
    }
  )
}

/**
 * Send email when a profile is rejected by admin
 */
export const sendProfileRejectedEmail = async (email, profileData, reason) => {
  return sendEmail(
    email,
    'Wedding Counselors - Profile Update Required',
    'profile_rejected',
    {
      name: profileData.full_name,
      reason: reason
    }
  )
}

/**
 * Send welcome email when profile is created
 */
export const sendProfileCreatedEmail = async (email, profileData, profileUrl, baseUrl) => {
  return sendEmail(
    email,
    'Welcome to Wedding Counselors - Profile Submitted',
    'profile_created',
    {
      name: profileData.full_name,
      profileUrl: profileUrl
    }
  )
}

const sendClaimEmail = async (payload) => {
  const { data, error } = await supabase.functions.invoke('send-claim-email', {
    body: payload
  })

  if (error || !data?.success) {
    throw new Error(data?.error || error?.message || 'Email send failed')
  }

  return data
}

/**
 * Send confirmation email when claim is submitted
 * @param {string} email - Recipient email
 * @param {object} claimData - Claim submission data
 */
export const sendClaimSubmittedEmail = async (email, claimData) => {
  return sendClaimEmail({
    type: 'submitted',
    to: email,
    claimData: { ...claimData, email }
  })
}

/**
 * Send email when claim is approved
 * @param {string} email - Recipient email
 * @param {object} claimData - Approved claim data
 * @param {string} profileUrl - URL to the approved profile
 */
export const sendClaimApprovedEmail = async (email, claimData, profileUrl) => {
  return sendClaimEmail({
    type: 'approved',
    to: email,
    claimData,
    profileUrl
  })
}

/**
 * Send email when claim is rejected
 * @param {string} email - Recipient email
 * @param {object} claimData - Rejected claim data
 * @param {string} reason - Reason for rejection
 */
export const sendClaimRejectedEmail = async (email, claimData, reason) => {
  return sendClaimEmail({
    type: 'rejected',
    to: email,
    claimData,
    reason
  })
}

const emailNotifications = {
  sendClaimSubmittedEmail,
  sendClaimApprovedEmail,
  sendClaimRejectedEmail,
  sendProfileApprovedEmail,
  sendProfileRejectedEmail,
  sendProfileCreatedEmail
}

export default emailNotifications
