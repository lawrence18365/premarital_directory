/**
 * Email Notification Helpers
 *
 * These functions handle sending email notifications for profile claims.
 * Currently configured for console logging (development).
 *
 * TO IMPLEMENT IN PRODUCTION:
 * 1. Set up Supabase Edge Functions for server-side email sending
 * 2. Configure SendGrid, AWS SES, or similar email service
 * 3. Replace console.log calls with actual API calls
 */

/**
 * Send confirmation email when claim is submitted
 * @param {string} email - Recipient email
 * @param {object} claimData - Claim submission data
 */
export const sendClaimSubmittedEmail = async (email, claimData) => {
  // TODO: Implement actual email sending via Supabase Edge Function
  console.log('📧 EMAIL: Claim Submitted')
  console.log('To:', email)
  console.log('Subject: Your Profile Claim Has Been Submitted')
  console.log('Body:', `
    Hi ${claimData.full_name},

    Thank you for submitting your claim to Wedding Counselors Directory!

    We've received your information and will review it within 24-48 hours.
    You'll receive an email once your claim is approved.

    Submitted Information:
    - Name: ${claimData.full_name}
    - Email: ${email}
    - Profession: ${claimData.profession}
    - Location: ${claimData.city}, ${claimData.state_province}

    If you have any questions, reply to this email or contact us at support@weddingcounselors.com

    Best regards,
    The Wedding Counselors Team
  `)

  return { success: true }
}

/**
 * Send email when claim is approved
 * @param {string} email - Recipient email
 * @param {object} claimData - Approved claim data
 * @param {string} profileUrl - URL to the approved profile
 */
export const sendClaimApprovedEmail = async (email, claimData, profileUrl) => {
  // TODO: Implement actual email sending via Supabase Edge Function
  console.log('📧 EMAIL: Claim Approved')
  console.log('To:', email)
  console.log('Subject: Your Profile Claim Has Been Approved! 🎉')
  console.log('Body:', `
    Hi ${claimData.full_name},

    Great news! Your profile claim has been approved.

    Your profile is now live on Wedding Counselors Directory:
    ${profileUrl}

    Next Steps:
    1. Log in to your dashboard to complete your profile
    2. Add photos, update your bio, and list your specialties
    3. Start receiving inquiries from engaged couples

    Login here: https://www.weddingcounselors.com/professional/login

    If you need any help, contact us at support@weddingcounselors.com

    Welcome to the directory!

    Best regards,
    The Wedding Counselors Team
  `)

  return { success: true }
}

/**
 * Send email when claim is rejected
 * @param {string} email - Recipient email
 * @param {object} claimData - Rejected claim data
 * @param {string} reason - Reason for rejection
 */
export const sendClaimRejectedEmail = async (email, claimData, reason) => {
  // TODO: Implement actual email sending via Supabase Edge Function
  console.log('📧 EMAIL: Claim Rejected')
  console.log('To:', email)
  console.log('Subject: Update on Your Profile Claim')
  console.log('Body:', `
    Hi ${claimData.full_name},

    Thank you for your interest in joining Wedding Counselors Directory.

    Unfortunately, we were unable to approve your profile claim at this time.

    Reason: ${reason}

    If you believe this was a mistake or have questions, please contact us at support@weddingcounselors.com

    We're happy to work with you to resolve any issues.

    Best regards,
    The Wedding Counselors Team
  `)

  return { success: true }
}

/**
 * Notify admin of new claim submission
 * @param {string} adminEmail - Admin email address
 * @param {object} claimData - New claim data
 * @param {string} claimUrl - URL to review the claim
 */
export const notifyAdminNewClaim = async (adminEmail, claimData, claimUrl) => {
  // TODO: Implement actual email sending via Supabase Edge Function
  console.log('📧 EMAIL: New Claim (Admin Notification)')
  console.log('To:', adminEmail)
  console.log('Subject: New Profile Claim Requires Review')
  console.log('Body:', `
    New profile claim submitted:

    Name: ${claimData.full_name}
    Email: ${claimData.submitted_by_email}
    Profession: ${claimData.profession}
    Location: ${claimData.city}, ${claimData.state_province}

    Review claim: ${claimUrl}
  `)

  return { success: true }
}

export default {
  sendClaimSubmittedEmail,
  sendClaimApprovedEmail,
  sendClaimRejectedEmail,
  notifyAdminNewClaim
}
