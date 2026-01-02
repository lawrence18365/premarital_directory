/**
 * Database Status Checker
 *
 * Run this to see exactly what's in your Supabase database.
 * Usage: node check-db-status.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials in .env file');
  console.log('Looking for: SUPABASE_URL and SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('\n=== DATABASE STATUS CHECK ===\n');

  // Check total profiles
  const { count: totalProfiles, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('Error counting profiles:', countError.message);
  } else {
    console.log(`Total Profiles: ${totalProfiles || 0}`);
  }

  // Check claimed vs unclaimed
  const { count: claimedCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_claimed', true);

  const { count: unclaimedCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_claimed', false);

  console.log(`  - Claimed: ${claimedCount || 0}`);
  console.log(`  - Unclaimed: ${unclaimedCount || 0}`);

  // Check profiles with emails
  const { count: withEmail } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('email', 'is', null);

  console.log(`  - With email: ${withEmail || 0}`);

  // Check profiles with phones
  const { count: withPhone } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('phone', 'is', null);

  console.log(`  - With phone: ${withPhone || 0}`);

  // Check profiles with websites
  const { count: withWebsite } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('website', 'is', null);

  console.log(`  - With website: ${withWebsite || 0}`);

  // Check profiles by city (top 10)
  const { data: cityData } = await supabase
    .from('profiles')
    .select('city')
    .not('city', 'is', null);

  if (cityData && cityData.length > 0) {
    const cityCounts = {};
    cityData.forEach(p => {
      cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
    });

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('\nTop Cities:');
    topCities.forEach(([city, count]) => {
      console.log(`  - ${city}: ${count}`);
    });
  }

  // Check leads
  const { count: totalLeads } = await supabase
    .from('profile_leads')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal Leads/Inquiries: ${totalLeads || 0}`);

  // Check profile claims (pending)
  const { count: pendingClaims } = await supabase
    .from('profile_claims')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  console.log(`Pending Profile Claims: ${pendingClaims || 0}`);

  // Sample some profiles
  const { data: sampleProfiles } = await supabase
    .from('profiles')
    .select('full_name, city, state_province, email, phone, website, is_claimed')
    .limit(5);

  if (sampleProfiles && sampleProfiles.length > 0) {
    console.log('\nSample Profiles:');
    sampleProfiles.forEach(p => {
      console.log(`  - ${p.full_name} (${p.city}, ${p.state_province})`);
      console.log(`    Email: ${p.email || 'none'} | Phone: ${p.phone || 'none'} | Web: ${p.website ? 'yes' : 'no'} | Claimed: ${p.is_claimed}`);
    });
  } else {
    console.log('\nNo profiles found in database.');
  }

  console.log('\n=== END STATUS CHECK ===\n');
}

checkDatabase().catch(console.error);
