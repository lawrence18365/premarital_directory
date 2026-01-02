/**
 * Counselor Discovery Script
 *
 * Finds premarital counselors from public sources.
 * Run manually or on a cron job.
 *
 * Usage: node scrape-counselors.js --city="austin" --state="texas"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Target cities for initial rollout - focus on ONE first
const TARGET_CITIES = [
  { city: 'Austin', state: 'Texas', stateAbbr: 'TX' },
  // Add more as you scale
];

/**
 * Psychology Today Search URL Generator
 *
 * PT's search is public - you can manually search and extract results.
 * This generates the URLs you need to visit.
 */
function generatePTSearchUrls(city, state) {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const stateSlug = state.toLowerCase().replace(/\s+/g, '-');

  return {
    // Search for premarital counseling specialty
    premarital: `https://www.psychologytoday.com/us/therapists/premarital-counseling/${stateSlug}/${citySlug}`,
    // Search for marriage counseling (often overlaps)
    marriage: `https://www.psychologytoday.com/us/therapists/marriage-counseling/${stateSlug}/${citySlug}`,
    // Search for couples therapy
    couples: `https://www.psychologytoday.com/us/therapists/couples-counseling/${stateSlug}/${citySlug}`
  };
}

/**
 * Manual Data Entry Template
 *
 * Since we're not scraping (legal gray area), here's a template
 * for manually collecting counselor data from public profiles.
 */
const COUNSELOR_TEMPLATE = {
  full_name: '',           // "Dr. Jane Smith, LMFT"
  email: '',               // From their website/PT profile
  phone: '',               // Public phone number
  website: '',             // Their website URL
  city: '',                // "Austin"
  state_province: '',      // "TX" or "Texas"
  profession: '',          // "Licensed Therapist", "Marriage & Family Therapist", etc.
  bio: '',                 // Short description (write your own, don't copy)
  specialties: [],         // ["Premarital Counseling", "Communication Skills"]
  source_url: '',          // Where you found them (for your records)
  source: 'psychology_today' // or 'google', 'church_website', etc.
};

/**
 * Create unclaimed profile from counselor data
 */
async function createUnclaimedProfile(counselor) {
  // Generate slug
  const slug = `${counselor.full_name}-${counselor.city}-${counselor.state_province}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    + '-' + Date.now().toString(36);

  const profileData = {
    full_name: counselor.full_name,
    email: counselor.email || null,
    phone: counselor.phone || null,
    website: counselor.website || null,
    city: counselor.city,
    state_province: counselor.state_province,
    country: 'United States',
    profession: counselor.profession || 'Licensed Therapist',
    bio: counselor.bio || null,
    specialties: counselor.specialties || ['Premarital Counseling'],
    slug: slug,
    is_claimed: false,  // IMPORTANT: Mark as unclaimed
    is_hidden: false,
    tier: 'community',
    source: counselor.source || 'manual_entry',
    source_url: counselor.source_url || null,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert([profileData])
    .select()
    .single();

  if (error) {
    console.error(`Failed to create profile for ${counselor.full_name}:`, error.message);
    return null;
  }

  console.log(`✓ Created unclaimed profile: ${counselor.full_name} (${slug})`);
  return data;
}

/**
 * Batch create profiles from a JSON file
 */
async function batchCreateProfiles(counselorsFile) {
  const counselors = require(counselorsFile);

  console.log(`Creating ${counselors.length} unclaimed profiles...`);

  let created = 0;
  let failed = 0;

  for (const counselor of counselors) {
    const result = await createUnclaimedProfile(counselor);
    if (result) {
      created++;
    } else {
      failed++;
    }
    // Rate limit to avoid overwhelming DB
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nDone! Created: ${created}, Failed: ${failed}`);
}

/**
 * Get unclaimed profiles ready for outreach
 */
async function getUnclaimedProfiles(city, limit = 50) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_claimed', false)
    .eq('city', city)
    .is('outreach_sent_at', null)  // Haven't emailed yet
    .not('email', 'is', null)      // Has email
    .limit(limit);

  if (error) {
    console.error('Error fetching unclaimed profiles:', error);
    return [];
  }

  return data;
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'urls') {
  // Generate Psychology Today search URLs
  const city = args[1] || 'Austin';
  const state = args[2] || 'Texas';

  console.log(`\nPsychology Today search URLs for ${city}, ${state}:\n`);
  const urls = generatePTSearchUrls(city, state);
  Object.entries(urls).forEach(([type, url]) => {
    console.log(`${type}: ${url}`);
  });
  console.log('\nVisit these pages and manually collect counselor data.');

} else if (command === 'create') {
  // Create profiles from JSON file
  const file = args[1];
  if (!file) {
    console.log('Usage: node scrape-counselors.js create ./counselors.json');
    process.exit(1);
  }
  batchCreateProfiles(file);

} else if (command === 'pending') {
  // Show profiles ready for outreach
  const city = args[1] || 'Austin';
  getUnclaimedProfiles(city).then(profiles => {
    console.log(`\n${profiles.length} unclaimed profiles in ${city} ready for outreach:\n`);
    profiles.forEach(p => {
      console.log(`- ${p.full_name} (${p.email})`);
    });
  });

} else {
  console.log(`
Counselor Discovery Tool

Commands:
  urls [city] [state]     - Generate Psychology Today search URLs
  create [file.json]      - Batch create profiles from JSON
  pending [city]          - Show unclaimed profiles ready for outreach

Example workflow:
  1. node scrape-counselors.js urls Austin Texas
  2. Visit URLs, manually collect 20 counselors into counselors.json
  3. node scrape-counselors.js create ./counselors.json
  4. node scrape-counselors.js pending Austin
  `);
}

module.exports = {
  createUnclaimedProfile,
  batchCreateProfiles,
  getUnclaimedProfiles,
  generatePTSearchUrls,
  COUNSELOR_TEMPLATE
};
