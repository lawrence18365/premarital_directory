/**
 * Extract two outreach-ready CSVs from Supabase:
 *  1. claimed-counselors.csv — all 42 claimed real counselors (warmest list)
 *  2. unclaimed-with-email.csv — scraped profiles that have an email,
 *     ready for "claim + $79 founding listing" outreach.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bkjwctlolhoxhnoospwp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'monetization', 'handoff-scripts');
fs.mkdirSync(OUT_DIR, { recursive: true });

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v).replace(/\r?\n/g, ' ').replace(/"/g, '""');
  return /[",]/.test(s) ? `"${s}"` : s;
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const body = rows.map(r => columns.map(c => csvEscape(r[c])).join(',')).join('\n');
  return header + '\n' + body + '\n';
}

(async () => {
  // Discover the columns on profiles so we don't 400 on a missing one
  const { data: sample } = await supabase.from('profiles').select('*').limit(1);
  const cols = sample && sample[0] ? Object.keys(sample[0]) : [];
  const has = c => cols.includes(c);
  console.log('profiles columns:', cols.join(', '));

  const baseSelect = [
    'id', 'full_name', 'email', 'state_province', 'city', 'slug', 'is_claimed',
    'is_hidden', 'moderation_status', 'created_at',
    has('phone') && 'phone',
    has('website') && 'website',
    has('profession') && 'profession',
    has('credentials') && 'credentials',
    has('tier') && 'tier',
    has('user_id') && 'user_id',
    has('claimed_at') && 'claimed_at',
    has('is_seeded') && 'is_seeded',
    has('data_source') && 'data_source',
  ].filter(Boolean).join(',');

  // 1. Claimed counselors (warmest list)
  const { data: claimed, error: claimedErr } = await supabase
    .from('profiles')
    .select(baseSelect)
    .eq('is_claimed', true)
    .not('email', 'is', null)
    .order('claimed_at', { ascending: false, nullsFirst: false });

  if (claimedErr) { console.error('claimed err', claimedErr); process.exit(1); }
  console.log(`Claimed counselors with email: ${claimed.length}`);

  const claimedCsv = toCsv(claimed.map(p => ({
    ...p,
    profile_url: p.slug && p.state_province && p.city
      ? `https://weddingcounselors.com/premarital-counseling/${String(p.state_province).toLowerCase()}/${String(p.city).toLowerCase().replace(/\s+/g, '-')}/${p.slug}`
      : '',
  })), [...(claimed[0] ? Object.keys(claimed[0]) : []), 'profile_url']);

  fs.writeFileSync(path.join(OUT_DIR, 'claimed-counselors.csv'), claimedCsv);

  // 2. Unclaimed with email — best targets for "$79 claim + featured" outreach
  const { data: unclaimed, error: unclaimedErr } = await supabase
    .from('profiles')
    .select(baseSelect)
    .eq('is_claimed', false)
    .not('email', 'is', null)
    .eq('is_hidden', false)
    .order('state_province', { ascending: true, nullsFirst: false })
    .limit(800);

  if (unclaimedErr) { console.error('unclaimed err', unclaimedErr); process.exit(1); }
  console.log(`Unclaimed with email (top 500): ${unclaimed.length}`);

  // Filter out obviously-bad emails
  const FREE_DOMAINS_OK = true; // keep gmail/yahoo for now — most therapists use them
  const filtered = unclaimed.filter(p => {
    const e = (p.email || '').toLowerCase().trim();
    if (!e || !e.includes('@')) return false;
    if (e.includes('noreply') || e.includes('no-reply')) return false;
    if (e.endsWith('.png') || e.endsWith('.jpg')) return false;
    return true;
  });
  console.log(`Unclaimed after email cleanup: ${filtered.length}`);

  const unclaimedCsv = toCsv(filtered.map(p => ({
    ...p,
    profile_url: p.slug && p.state_province && p.city
      ? `https://weddingcounselors.com/premarital-counseling/${String(p.state_province).toLowerCase()}/${String(p.city).toLowerCase().replace(/\s+/g, '-')}/${p.slug}`
      : '',
  })), [...(filtered[0] ? Object.keys(filtered[0]) : []), 'profile_url']);

  fs.writeFileSync(path.join(OUT_DIR, 'unclaimed-with-email.csv'), unclaimedCsv);

  // Summary by state
  const byState = {};
  for (const p of filtered) byState[p.state_province || '(none)'] = (byState[p.state_province || '(none)'] || 0) + 1;
  const stateRanking = Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 20);

  console.log('\nTop states by unclaimed-with-email count:');
  for (const [st, n] of stateRanking) console.log(`  ${st}: ${n}`);

  console.log(`\nWritten to:`);
  console.log(`  ${path.join(OUT_DIR, 'claimed-counselors.csv')}`);
  console.log(`  ${path.join(OUT_DIR, 'unclaimed-with-email.csv')}`);
})();
