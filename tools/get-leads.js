/**
 * Get All Leads
 * Shows the actual leads that have come in
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function getLeads() {
  const { data: leads, error } = await supabase
    .from('profile_leads')
    .select(`
      *,
      profile:profiles(full_name, city, state_province, email, phone, is_claimed)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('\n=== LEADS IN YOUR SYSTEM ===\n');
  console.log(`Total: ${leads.length}\n`);

  leads.forEach((lead, i) => {
    console.log(`--- Lead #${i + 1} ---`);
    console.log(`Date: ${new Date(lead.created_at).toLocaleDateString()}`);
    console.log(`Couple: ${lead.couple_name}`);
    console.log(`Email: ${lead.couple_email}`);
    console.log(`Phone: ${lead.couple_phone || 'not provided'}`);
    console.log(`Location: ${lead.location || 'not provided'}`);
    console.log(`Wedding: ${lead.wedding_date || 'not provided'}`);
    console.log(`Message: ${lead.message?.substring(0, 100)}...`);
    console.log(`Status: ${lead.status}`);
    if (lead.profile) {
      console.log(`For Counselor: ${lead.profile.full_name} (${lead.profile.city}, ${lead.profile.state_province})`);
      console.log(`Counselor Claimed: ${lead.profile.is_claimed ? 'YES' : 'NO'}`);
      console.log(`Counselor Email: ${lead.profile.email || 'none'}`);
      console.log(`Counselor Phone: ${lead.profile.phone || 'none'}`);
    }
    console.log('');
  });
}

getLeads();
