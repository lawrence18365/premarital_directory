/**
 * One-off audit: how many REAL humans are actually in our Supabase?
 * Counselors, couples, leads, claims, profile views.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bkjwctlolhoxhnoospwp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function count(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) return `ERROR: ${error.message}`;
  return count;
}

async function listColumns(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) return `ERROR: ${error.message}`;
  return data && data[0] ? Object.keys(data[0]) : '(empty table)';
}

(async () => {
  const profilesTotal = await count('profiles');
  const profilesClaimed = await count('profiles', q => q.eq('is_claimed', true));
  const profilesApproved = await count('profiles', q => q.eq('moderation_status', 'approved'));
  const profilesHidden = await count('profiles', q => q.eq('is_hidden', true));
  const profilesWithEmail = await count('profiles', q => q.not('email', 'is', null));

  const leads = await count('profile_leads');
  const leadsLast30 = await count('profile_leads', q => q.gte('created_at', new Date(Date.now() - 30*864e5).toISOString()));
  const leadsLast7 = await count('profile_leads', q => q.gte('created_at', new Date(Date.now() - 7*864e5).toISOString()));

  const clicks = await count('profile_clicks');
  const clicks30 = await count('profile_clicks', q => q.gte('created_at', new Date(Date.now() - 30*864e5).toISOString()));

  const dnc = await count('do_not_contact');

  // Best-effort additional tables (will fail gracefully if missing)
  const coupleSubs = await count('couple_subscribers');
  const platformLeads = await count('platform_leads');
  const dripLog = await count('drip_email_log');
  const digestLog = await count('digest_send_log');
  const proSubs = await count('professional_subscriptions');

  const out = {
    profiles: {
      total: profilesTotal,
      claimed: profilesClaimed,
      approved: profilesApproved,
      hidden: profilesHidden,
      with_email: profilesWithEmail,
    },
    profile_leads: {
      total: leads,
      last_30d: leadsLast30,
      last_7d: leadsLast7,
    },
    profile_clicks: {
      total: clicks,
      last_30d: clicks30,
    },
    do_not_contact: dnc,
    couple_subscribers: coupleSubs,
    platform_leads: platformLeads,
    drip_email_log: dripLog,
    digest_send_log: digestLog,
    professional_subscriptions: proSubs,
  };

  console.log(JSON.stringify(out, null, 2));

  // Show recent leads for context
  const { data: recentLeads } = await supabase
    .from('profile_leads')
    .select('id, profile_id, created_at, name, email, message')
    .order('created_at', { ascending: false })
    .limit(15);
  console.log('\n--- 15 most recent leads ---');
  if (recentLeads) {
    for (const l of recentLeads) {
      const msg = (l.message || '').replace(/\s+/g, ' ').slice(0, 80);
      console.log(`${l.created_at}  ${l.email || '(no-email)'}  prof=${l.profile_id || 'null'}  "${msg}"`);
    }
  }

  // Recent profile signups
  const { data: recentProfiles } = await supabase
    .from('profiles')
    .select('id, created_at, email, full_name, is_claimed, moderation_status')
    .order('created_at', { ascending: false })
    .limit(15);
  console.log('\n--- 15 most recent profiles ---');
  if (recentProfiles) {
    for (const p of recentProfiles) {
      console.log(`${p.created_at}  ${p.email || '(no-email)'}  claimed=${p.is_claimed}  mod=${p.moderation_status}  ${p.full_name}`);
    }
  }
})();
