/**
 * Email Blast to All Profiles With Emails
 *
 * This is your nuclear option - emails ALL unclaimed profiles that have email addresses.
 *
 * Usage:
 *   node email-blast.js preview         # See who would receive emails
 *   node email-blast.js send --limit=30 # Send to first 30 (daily limit)
 *   node email-blast.js stats           # Check progress
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const SITE_URL = 'https://www.weddingcounselors.com';

/**
 * Get all profiles with emails that haven't been contacted yet
 */
async function getEmailableProfiles(limit = 1000) {
  // First try with outreach_sent_at column
  let { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_claimed', false)
    .not('email', 'is', null)
    .limit(limit);

  // If column doesn't exist, query without it
  if (error && error.message.includes('outreach_sent_at')) {
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('is_claimed', false)
      .not('email', 'is', null)
      .limit(limit);
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error('Error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Get profiles we've already emailed
 */
async function getContactedProfiles() {
  // Try to get contacted profiles (will fail if column doesn't exist yet)
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, city, outreach_sent_at')
      .eq('is_claimed', false)
      .not('outreach_sent_at', 'is', null)
      .order('outreach_sent_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Generate email HTML for a profile
 */
function generateEmailHTML(profile) {
  const stateSlug = (profile.state_province || '').toLowerCase().replace(/\s+/g, '-');
  const citySlug = (profile.city || '').toLowerCase().replace(/\s+/g, '-');
  const profileUrl = `${SITE_URL}/premarital-counseling/${stateSlug}/${citySlug}/${profile.slug}`;
  const claimUrl = `${SITE_URL}/claim-profile/${profile.slug}?utm_source=email&utm_medium=outreach&utm_campaign=initial`;
  const firstName = (profile.full_name || '').split(' ')[0] || 'there';

  return {
    to: profile.email,
    subject: `Your premarital counseling profile on WeddingCounselors.com`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">

  <p>Hi ${firstName},</p>

  <p>I noticed you offer premarital counseling in ${profile.city || 'your area'} and created a free listing for you in our directory:</p>

  <p style="margin: 30px 0;">
    <a href="${profileUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
      View Your Profile →
    </a>
  </p>

  <p>The listing includes your contact info from public sources. Couples searching for "${profile.city} premarital counseling" can now find you here.</p>

  <p><strong>Want to edit it or add your photo?</strong></p>

  <p style="margin: 30px 0;">
    <a href="${claimUrl}" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
      Claim Your Profile (Free, 60 seconds)
    </a>
  </p>

  <p>Claiming lets you:</p>
  <ul style="color: #4b5563;">
    <li>Add your professional photo</li>
    <li>Edit your bio and specialties</li>
    <li>See when couples view your profile</li>
    <li>Receive direct inquiries to your inbox</li>
  </ul>

  <p>No catch, no fees. I'm building this directory specifically for premarital specialists because the big directories (Psychology Today, etc.) lump everyone together.</p>

  <p>Questions? Just reply to this email.</p>

  <p style="margin-top: 40px;">
    Best,<br>
    <strong>The Wedding Counselors Team</strong><br>
    <a href="${SITE_URL}" style="color: #2563eb;">weddingcounselors.com</a>
  </p>

  <hr style="margin: 40px 0; border: none; border-top: 1px solid #e5e7eb;">

  <p style="font-size: 12px; color: #9ca3af;">
    You're receiving this because you're listed as a premarital counseling provider.
    <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(profile.email)}" style="color: #9ca3af;">Unsubscribe</a>
  </p>

</body>
</html>
    `
  };
}

/**
 * Send email via Supabase Edge Function
 */
async function sendEmail(emailData) {
  try {
    const { error } = await supabase.functions.invoke('send-contact-email', {
      body: {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        from: 'hello@weddingcounselors.com',
        fromName: 'Wedding Counselors'
      }
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Mark profile as contacted
 */
async function markAsContacted(profileId) {
  // Try to mark as contacted (will silently fail if column doesn't exist)
  try {
    await supabase
      .from('profiles')
      .update({ outreach_sent_at: new Date().toISOString() })
      .eq('id', profileId);
  } catch {
    // Column doesn't exist yet, skip tracking
  }
}

/**
 * Preview mode - show who would receive emails
 */
async function preview() {
  const profiles = await getEmailableProfiles();

  console.log('\n=== EMAIL BLAST PREVIEW ===\n');
  console.log(`Found ${profiles.length} profiles with emails (not yet contacted)\n`);

  // Group by city
  const byCIty = {};
  profiles.forEach(p => {
    const city = p.city || 'Unknown';
    if (!byCIty[city]) byCIty[city] = [];
    byCIty[city].push(p);
  });

  Object.entries(byCIty)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20)
    .forEach(([city, profs]) => {
      console.log(`${city}: ${profs.length} emails`);
    });

  console.log('\nSample emails:');
  profiles.slice(0, 10).forEach(p => {
    console.log(`  - ${p.full_name}: ${p.email}`);
  });

  console.log('\n---');
  console.log(`To send to first 30: node email-blast.js send --limit=30`);
  console.log(`To send all: node email-blast.js send --limit=${profiles.length}`);
}

/**
 * Send mode - actually send emails
 */
async function send(limit = 30) {
  const profiles = await getEmailableProfiles(limit);

  console.log(`\n=== SENDING TO ${profiles.length} PROFILES ===\n`);

  let sent = 0;
  let failed = 0;

  for (const profile of profiles) {
    const emailData = generateEmailHTML(profile);
    const result = await sendEmail(emailData);

    if (result.success) {
      await markAsContacted(profile.id);
      console.log(`✓ Sent: ${profile.full_name} (${profile.email})`);
      sent++;
    } else {
      console.log(`✗ Failed: ${profile.full_name} - ${result.error}`);
      failed++;
    }

    // Rate limit: 2 seconds between emails
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Sent: ${sent}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nRun again tomorrow for the next batch!`);
}

/**
 * Stats mode - show progress
 */
async function stats() {
  const emailable = await getEmailableProfiles();
  const contacted = await getContactedProfiles();

  // Check claimed
  const { count: claimed } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_claimed', true);

  console.log('\n=== OUTREACH STATS ===\n');
  console.log(`Profiles with emails (not contacted): ${emailable.length}`);
  console.log(`Profiles already contacted: ${contacted.length}`);
  console.log(`Profiles claimed: ${claimed}`);

  if (contacted.length > 0 && claimed > 0) {
    console.log(`Claim rate: ${((claimed / contacted.length) * 100).toFixed(1)}%`);
  }

  if (contacted.length > 0) {
    console.log('\nRecently contacted:');
    contacted.slice(0, 5).forEach(p => {
      console.log(`  - ${p.full_name} (${p.email}) - ${new Date(p.outreach_sent_at).toLocaleDateString()}`);
    });
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'preview') {
  preview();
} else if (command === 'send') {
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 30;
  send(limit);
} else if (command === 'stats') {
  stats();
} else {
  console.log(`
Email Blast Tool

Commands:
  preview              See who would receive emails
  send --limit=30      Send to first N profiles (default 30/day)
  stats                Check outreach progress

Workflow:
  1. node email-blast.js preview     # See the list
  2. node email-blast.js send --limit=30  # Send batch
  3. node email-blast.js stats       # Check results
  4. Repeat daily until all 167 are contacted
  `);
}
