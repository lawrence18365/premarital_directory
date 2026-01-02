/**
 * Automated Outreach Email System
 *
 * Sends personalized "claim your profile" emails to unclaimed counselors.
 * Tracks sends, opens, and follows up automatically.
 *
 * Usage:
 *   node send-outreach.js send --city="Austin" --limit=30
 *   node send-outreach.js followup
 *   node send-outreach.js stats
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

const SITE_URL = 'https://www.weddingcounselors.com';
const FROM_EMAIL = 'hello@weddingcounselors.com';
const FROM_NAME = 'Wedding Counselors';

/**
 * Email Templates
 */
const EMAIL_TEMPLATES = {
  // Initial outreach - "You're already listed"
  initial: (profile) => ({
    subject: `Your premarital counseling profile on WeddingCounselors.com`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${profile.full_name.split(' ')[0] || 'there'},</p>

        <p>I noticed you offer premarital counseling in ${profile.city} and created a free listing for you in our directory:</p>

        <p style="margin: 25px 0;">
          <a href="${SITE_URL}/premarital-counseling/${profile.state_province.toLowerCase().replace(/\s+/g, '-')}/${profile.city.toLowerCase().replace(/\s+/g, '-')}/${profile.slug}"
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Your Profile →
          </a>
        </p>

        <p>The listing includes your contact info from your public profiles. Couples searching "${profile.city} premarital counseling" can now find you here.</p>

        <p><strong>Want to edit it or add more details?</strong></p>

        <p style="margin: 25px 0;">
          <a href="${SITE_URL}/claim-profile/${profile.slug}?utm_source=email&utm_medium=outreach&utm_campaign=claim_profile"
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Claim Your Profile (Free, 60 seconds)
          </a>
        </p>

        <p>No catch, no fees. I'm building this directory specifically for premarital specialists and want the best counselors represented.</p>

        <p>Questions? Just reply to this email.</p>

        <p style="margin-top: 30px;">
          Best,<br>
          The Wedding Counselors Team
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <p style="font-size: 12px; color: #6b7280;">
          You're receiving this because you're listed as a premarital counseling provider in ${profile.city}, ${profile.state_province}.
          <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(profile.email)}">Unsubscribe</a>
        </p>
      </div>
    `
  }),

  // Follow-up 1 (Day 3) - Social proof / curiosity
  followup1: (profile) => ({
    subject: `Re: Your premarital counseling profile`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${profile.full_name.split(' ')[0] || 'there'},</p>

        <p>Quick follow-up — your profile on WeddingCounselors.com is live and visible to couples searching for premarital counseling in ${profile.city}.</p>

        <p>Several other counselors in your area have already claimed their profiles this week. Claiming lets you:</p>

        <ul style="color: #374151;">
          <li>Edit your bio and specialties</li>
          <li>Add your photo (profiles with photos get more inquiries)</li>
          <li>See when couples view your profile</li>
          <li>Receive direct inquiries to your inbox</li>
        </ul>

        <p style="margin: 25px 0;">
          <a href="${SITE_URL}/claim-profile/${profile.slug}?utm_source=email&utm_medium=outreach&utm_campaign=followup1"
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Claim Your Free Profile
          </a>
        </p>

        <p>Takes 60 seconds, completely free.</p>

        <p style="margin-top: 30px;">
          Best,<br>
          The Wedding Counselors Team
        </p>
      </div>
    `
  }),

  // Follow-up 2 (Day 7) - Direct ask
  followup2: (profile) => ({
    subject: `Quick question about your listing`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${profile.full_name.split(' ')[0] || 'there'},</p>

        <p>I wanted to make sure the information on your profile is accurate. Currently showing:</p>

        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>${profile.full_name}</strong></p>
          <p style="margin: 5px 0; color: #6b7280;">${profile.city}, ${profile.state_province}</p>
          ${profile.phone ? `<p style="margin: 5px 0; color: #6b7280;">📞 ${profile.phone}</p>` : ''}
          ${profile.website ? `<p style="margin: 5px 0; color: #6b7280;">🌐 ${profile.website}</p>` : ''}
        </div>

        <p>Is this correct? If anything needs updating, you can claim your profile and edit it yourself:</p>

        <p style="margin: 25px 0;">
          <a href="${SITE_URL}/claim-profile/${profile.slug}?utm_source=email&utm_medium=outreach&utm_campaign=followup2"
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Update My Profile
          </a>
        </p>

        <p>Or just reply to this email with corrections and I'll update it for you.</p>

        <p style="margin-top: 30px;">
          Thanks,<br>
          The Wedding Counselors Team
        </p>
      </div>
    `
  }),

  // Final follow-up (Day 14) - Last chance
  final: (profile) => ({
    subject: `Last note about your ${profile.city} listing`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${profile.full_name.split(' ')[0] || 'there'},</p>

        <p>This is my last email about your WeddingCounselors.com profile.</p>

        <p>Your listing is live and will continue showing up when couples search for premarital counseling in ${profile.city}. If you ever want to claim it, the link is here:</p>

        <p style="margin: 20px 0;">
          <a href="${SITE_URL}/claim-profile/${profile.slug}" style="color: #2563eb;">
            ${SITE_URL}/claim-profile/${profile.slug}
          </a>
        </p>

        <p>No more emails from me unless someone tries to contact you through the directory.</p>

        <p>Wishing you continued success with your practice.</p>

        <p style="margin-top: 30px;">
          Best,<br>
          The Wedding Counselors Team
        </p>
      </div>
    `
  })
};

/**
 * Send email via Supabase Edge Function (uses your existing SMTP setup)
 */
async function sendEmail(to, subject, html) {
  try {
    const { error } = await supabase.functions.invoke('send-contact-email', {
      body: {
        to,
        subject,
        html,
        from: FROM_EMAIL,
        fromName: FROM_NAME
      }
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    return false;
  }
}

/**
 * Record outreach attempt in database
 */
async function recordOutreach(profileId, emailType, success) {
  const { error } = await supabase
    .from('outreach_log')
    .insert([{
      profile_id: profileId,
      email_type: emailType,
      sent_at: new Date().toISOString(),
      success
    }]);

  if (error) {
    console.error('Failed to log outreach:', error.message);
  }

  // Also update the profile's outreach timestamp
  if (emailType === 'initial') {
    await supabase
      .from('profiles')
      .update({ outreach_sent_at: new Date().toISOString() })
      .eq('id', profileId);
  }
}

/**
 * Send initial outreach to unclaimed profiles
 */
async function sendInitialOutreach(city, limit = 30) {
  // Get unclaimed profiles that haven't been emailed
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_claimed', false)
    .eq('city', city)
    .is('outreach_sent_at', null)
    .not('email', 'is', null)
    .limit(limit);

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`\nSending initial outreach to ${profiles.length} counselors in ${city}...\n`);

  let sent = 0;
  let failed = 0;

  for (const profile of profiles) {
    const template = EMAIL_TEMPLATES.initial(profile);
    const success = await sendEmail(profile.email, template.subject, template.html);

    await recordOutreach(profile.id, 'initial', success);

    if (success) {
      console.log(`✓ Sent to ${profile.full_name} (${profile.email})`);
      sent++;
    } else {
      console.log(`✗ Failed: ${profile.full_name} (${profile.email})`);
      failed++;
    }

    // Rate limit: 1 email per 2 seconds = 30/minute
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\nDone! Sent: ${sent}, Failed: ${failed}`);
}

/**
 * Send follow-up emails based on timing
 */
async function sendFollowups() {
  const now = new Date();

  // Get profiles that need follow-ups
  const { data: logs, error } = await supabase
    .from('outreach_log')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('success', true)
    .order('sent_at', { ascending: true });

  if (error) {
    console.error('Error fetching outreach logs:', error);
    return;
  }

  // Group by profile and find what follow-up is needed
  const profileFollowups = {};

  for (const log of logs) {
    const profileId = log.profile_id;
    if (!profileFollowups[profileId]) {
      profileFollowups[profileId] = {
        profile: log.profile,
        emails: []
      };
    }
    profileFollowups[profileId].emails.push(log);
  }

  let followupsSent = 0;

  for (const [profileId, data] of Object.entries(profileFollowups)) {
    const profile = data.profile;

    // Skip if profile was claimed
    if (profile.is_claimed) continue;

    const emailTypes = data.emails.map(e => e.email_type);
    const lastEmail = data.emails[data.emails.length - 1];
    const daysSinceLastEmail = (now - new Date(lastEmail.sent_at)) / (1000 * 60 * 60 * 24);

    let templateKey = null;

    // Determine which follow-up to send
    if (!emailTypes.includes('followup1') && daysSinceLastEmail >= 3) {
      templateKey = 'followup1';
    } else if (!emailTypes.includes('followup2') && emailTypes.includes('followup1') && daysSinceLastEmail >= 4) {
      templateKey = 'followup2';
    } else if (!emailTypes.includes('final') && emailTypes.includes('followup2') && daysSinceLastEmail >= 7) {
      templateKey = 'final';
    }

    if (templateKey && profile.email) {
      const template = EMAIL_TEMPLATES[templateKey](profile);
      const success = await sendEmail(profile.email, template.subject, template.html);
      await recordOutreach(profileId, templateKey, success);

      if (success) {
        console.log(`✓ Sent ${templateKey} to ${profile.full_name}`);
        followupsSent++;
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\nSent ${followupsSent} follow-up emails.`);
}

/**
 * Show outreach statistics
 */
async function showStats() {
  // Get all outreach logs
  const { data: logs } = await supabase
    .from('outreach_log')
    .select('*');

  // Get claimed profiles
  const { data: claimed } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_claimed', true);

  const stats = {
    total_sent: logs?.length || 0,
    initial_emails: logs?.filter(l => l.email_type === 'initial').length || 0,
    followup1: logs?.filter(l => l.email_type === 'followup1').length || 0,
    followup2: logs?.filter(l => l.email_type === 'followup2').length || 0,
    final: logs?.filter(l => l.email_type === 'final').length || 0,
    total_claimed: claimed?.length || 0
  };

  console.log(`
Outreach Statistics
-------------------
Total emails sent: ${stats.total_sent}
  - Initial:    ${stats.initial_emails}
  - Follow-up 1: ${stats.followup1}
  - Follow-up 2: ${stats.followup2}
  - Final:       ${stats.final}

Profiles claimed: ${stats.total_claimed}
Claim rate: ${stats.initial_emails > 0 ? ((stats.total_claimed / stats.initial_emails) * 100).toFixed(1) : 0}%
  `);
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'send') {
  const cityArg = args.find(a => a.startsWith('--city='));
  const limitArg = args.find(a => a.startsWith('--limit='));

  const city = cityArg ? cityArg.split('=')[1] : 'Austin';
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 30;

  sendInitialOutreach(city, limit);

} else if (command === 'followup') {
  sendFollowups();

} else if (command === 'stats') {
  showStats();

} else {
  console.log(`
Outreach Automation Tool

Commands:
  send --city="Austin" --limit=30   Send initial emails to unclaimed profiles
  followup                          Send follow-up emails (run daily)
  stats                             Show outreach statistics

Daily workflow:
  1. node send-outreach.js send --city="Austin" --limit=30
  2. node send-outreach.js followup
  3. node send-outreach.js stats
  `);
}

module.exports = {
  sendInitialOutreach,
  sendFollowups,
  showStats
};
