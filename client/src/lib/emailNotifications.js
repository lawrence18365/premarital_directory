/**
 * Email Notification Helpers
 *
 * Production-ready email notifications using Resend API.
 *
 * SETUP INSTRUCTIONS:
 * 1. Sign up at resend.com (3,000 free emails/month)
 * 2. Get your API key from dashboard
 * 3. Add to .env.production:
 *    REACT_APP_RESEND_API_KEY=re_your_api_key
 *    REACT_APP_FROM_EMAIL=notifications@yourdomain.com
 *    REACT_APP_ADMIN_EMAIL=admin@yourdomain.com
 *
 * ALTERNATIVE EMAIL PROVIDERS:
 * - To use SendGrid: npm install @sendgrid/mail
 * - To use AWS SES: npm install @aws-sdk/client-ses
 * - To use Supabase Edge Functions: deploy to supabase/functions/
 */

// Email configuration
const EMAIL_CONFIG = {
  apiKey: process.env.REACT_APP_RESEND_API_KEY,
  fromEmail: process.env.REACT_APP_FROM_EMAIL || 'notifications@premaritalcounseling.directory',
  adminEmail: process.env.REACT_APP_ADMIN_EMAIL || 'admin@premaritalcounseling.directory',
  useResend: !!process.env.REACT_APP_RESEND_API_KEY
}

/**
 * Send email via Resend API
 * @private
 */
const sendViaResend = async (to, subject, html) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`
    },
    body: JSON.stringify({
      from: EMAIL_CONFIG.fromEmail,
      to: [to],
      subject: subject,
      html: html
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Resend API error: ${error.message || response.statusText}`)
  }

  return await response.json()
}

/**
 * Fallback: Log email to console (development mode)
 * @private
 */
const logEmail = (to, subject, body) => {
  console.log('📧 EMAIL (Development Mode)')
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('Body:', body)
  console.log('\n💡 To enable real emails, set REACT_APP_RESEND_API_KEY in .env')
}

/**
 * Send confirmation email when claim is submitted
 * @param {string} email - Recipient email
 * @param {object} claimData - Claim submission data
 */
export const sendClaimSubmittedEmail = async (email, claimData) => {
  const subject = 'Your Profile Claim Has Been Submitted'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Profile Claim Submitted Successfully</h2>

      <p>Hi ${claimData.full_name},</p>

      <p>Thank you for submitting your claim to Premarital Counseling Directory!</p>

      <p>We've received your information and will review it within 24-48 hours. You'll receive an email once your claim is approved.</p>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Submitted Information:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Name:</strong> ${claimData.full_name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Profession:</strong> ${claimData.profession || 'Not specified'}</li>
          <li><strong>Location:</strong> ${claimData.city}, ${claimData.state_province}</li>
        </ul>
      </div>

      <p>If you have any questions, reply to this email or contact us.</p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Best regards,<br>
        The Premarital Counseling Directory Team
      </p>
    </div>
  `

  try {
    if (EMAIL_CONFIG.useResend) {
      await sendViaResend(email, subject, html)
      console.log('✅ Claim submitted email sent to:', email)
    } else {
      logEmail(email, subject, html)
    }
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to send claim submitted email:', error)
    // Don't throw - we don't want email failures to block claim submission
    return { success: false, error: error.message }
  }
}

/**
 * Send email when claim is approved
 * @param {string} email - Recipient email
 * @param {object} claimData - Approved claim data
 * @param {string} profileUrl - URL to the approved profile
 */
export const sendClaimApprovedEmail = async (email, claimData, profileUrl) => {
  const subject = '🎉 Your Profile Claim Has Been Approved!'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0;">✅ Claim Approved!</h2>
      </div>

      <div style="padding: 20px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
        <p>Hi ${claimData.full_name},</p>

        <p><strong>Great news!</strong> Your profile claim has been approved.</p>

        <p>Your profile is now live on Premarital Counseling Directory:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${profileUrl}"
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Your Profile
          </a>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Next Steps:</h3>
          <ol style="color: #4b5563; line-height: 1.8;">
            <li>Log in to your dashboard to complete your profile</li>
            <li>Add photos, update your bio, and list your specialties</li>
            <li>Start receiving inquiries from engaged couples</li>
          </ol>
        </div>

        <p>If you need any help getting started, feel free to reply to this email.</p>

        <p style="color: #10b981; font-weight: bold; margin-top: 30px;">Welcome to the directory! 🎊</p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          The Premarital Counseling Directory Team
        </p>
      </div>
    </div>
  `

  try {
    if (EMAIL_CONFIG.useResend) {
      await sendViaResend(email, subject, html)
      console.log('✅ Claim approved email sent to:', email)
    } else {
      logEmail(email, subject, html)
    }
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to send claim approved email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send email when claim is rejected
 * @param {string} email - Recipient email
 * @param {object} claimData - Rejected claim data
 * @param {string} reason - Reason for rejection
 */
export const sendClaimRejectedEmail = async (email, claimData, reason) => {
  const subject = 'Update on Your Profile Claim'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Profile Claim Update</h2>

      <p>Hi ${claimData.full_name},</p>

      <p>Thank you for your interest in joining Premarital Counseling Directory.</p>

      <p>Unfortunately, we were unable to approve your profile claim at this time.</p>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b;">
          <strong>Reason:</strong> ${reason || 'Please contact us for more information'}
        </p>
      </div>

      <p>If you believe this was a mistake or have questions, please reply to this email. We're happy to work with you to resolve any issues.</p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Best regards,<br>
        The Premarital Counseling Directory Team
      </p>
    </div>
  `

  try {
    if (EMAIL_CONFIG.useResend) {
      await sendViaResend(email, subject, html)
      console.log('✅ Claim rejected email sent to:', email)
    } else {
      logEmail(email, subject, html)
    }
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to send claim rejected email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Notify admin of new claim submission
 * @param {string} adminEmail - Admin email address (optional, uses config default)
 * @param {object} claimData - New claim data
 * @param {string} claimUrl - URL to review the claim
 */
export const notifyAdminNewClaim = async (adminEmail, claimData, claimUrl) => {
  const recipient = adminEmail || EMAIL_CONFIG.adminEmail
  const subject = '🔔 New Profile Claim Requires Review'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #fbbf24; color: #78350f; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🔔 New Profile Claim</h2>
      </div>

      <div style="padding: 20px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
        <p><strong>A new profile claim has been submitted and requires your review.</strong></p>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Claim Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Name:</strong></td>
              <td style="padding: 8px 0;">${claimData.full_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
              <td style="padding: 8px 0;">${claimData.submitted_by_email || claimData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Profession:</strong></td>
              <td style="padding: 8px 0;">${claimData.profession || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Location:</strong></td>
              <td style="padding: 8px 0;">${claimData.city}, ${claimData.state_province}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${claimUrl}"
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Review Claim Now
          </a>
        </div>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Premarital Counseling Directory.
        </p>
      </div>
    </div>
  `

  try {
    if (EMAIL_CONFIG.useResend) {
      await sendViaResend(recipient, subject, html)
      console.log('✅ Admin notification sent to:', recipient)
    } else {
      logEmail(recipient, subject, html)
    }
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error)
    return { success: false, error: error.message }
  }
}

export default {
  sendClaimSubmittedEmail,
  sendClaimApprovedEmail,
  sendClaimRejectedEmail,
  notifyAdminNewClaim
}
