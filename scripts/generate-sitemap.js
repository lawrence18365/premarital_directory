const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: [path.resolve(__dirname, '../client/.env.local'), path.resolve(__dirname, '../.env')] });

// These match the keys in client/src/data/specialtyConfig.js
const SPECIALTIES = [
  'christian',
  'catholic',
  'lgbtq',
  'online',
  'gottman',
  'prepare-enrich',
  'interfaith',
  'second-marriages',
  'military',
  'affordable'
];

const DISCOUNT_STATES = [
  'florida',
  'georgia',
  'maryland',
  'minnesota',
  'oklahoma',
  'tennessee',
  'texas',
  'indiana'
];

const BASE_URL = 'https://weddingcounselors.com';
const PUBLIC_DIR = path.join(__dirname, '../client/public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const MAX_URLS = 10000; // Increased limit to ensure high-value programmatic pages are caught

// Generate SEO-friendly slug (Matches client/src/lib/utils.js generateSlug)
const generateSlug = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials for sitemap generation.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to generate XML for a single URL
const createUrlEntry = (loc, lastmod, changefreq = 'daily', priority = '1.0') => {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
};

// Helper to generate a sitemap file
const writeSitemapFile = (filepath, urls) => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  fs.writeFileSync(filepath, sitemap);
};

const generateSitemap = async () => {
  console.log('Starting clean sitemap generation (SEO Optimized Phase 3)...');
  const today = new Date().toISOString().split('T')[0];
  const allUrls = [];

  // 1. Add static pages and programmatic hubs with high priority
  const baseStaticPages = [
    '/',
    '/premarital-counseling',
    '/locations',
    '/about',
    '/contact',
    '/pricing',
    '/features',
    '/guidelines',
    '/privacy',
    '/terms',
    '/premarital-counseling/marriage-license-discount'
  ];

  baseStaticPages.forEach(url => {
    allUrls.push(createUrlEntry(`${BASE_URL}${url}`, today, 'weekly', '1.0'));
  });

  // 1b. Add Specialty Hubs
  SPECIALTIES.forEach(slug => {
    allUrls.push(createUrlEntry(`${BASE_URL}/premarital-counseling/${slug}`, today, 'weekly', '0.9'));
  });

  // 1c. Add State Discount Pages
  DISCOUNT_STATES.forEach(state => {
    allUrls.push(createUrlEntry(`${BASE_URL}/premarital-counseling/marriage-license-discount/${state}`, today, 'weekly', '0.9'));
  });

  // Fetch all minimal profile data required for programmatic routes
  console.log('Fetching profile routing data...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('slug, state_province, city, created_at')
    .not('state_province', 'is', null)
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(MAX_URLS);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }

  const uniqueStates = new Set();
  const uniqueCities = new Set();

  // Parse Unique States and Cities
  profiles.forEach(p => {
    if (p.state_province) {
      const stateSlug = generateSlug(p.state_province);
      uniqueStates.add(stateSlug);

      if (p.city) {
        const citySlug = generateSlug(p.city);
        uniqueCities.add(`${stateSlug}/${citySlug}`);
      }
    }
  });

  console.log(`Discovered ${uniqueStates.size} State URLs and ${uniqueCities.size} City URLs.`);

  // 2. Add State directory pages (e.g., /premarital-counseling/california)
  uniqueStates.forEach(stateSlug => {
    allUrls.push(createUrlEntry(`${BASE_URL}/premarital-counseling/${stateSlug}`, today, 'daily', '0.9'));
  });

  // 3. Add City directory pages (e.g., /premarital-counseling/california/los-angeles)
  uniqueCities.forEach(stateCityCombo => {
    allUrls.push(createUrlEntry(`${BASE_URL}/premarital-counseling/${stateCityCombo}`, today, 'daily', '0.8'));
  });

  // 4. Add Top Professional Profiles
  let profileCount = 0;
  profiles.forEach(profile => {
    if (profile.slug && profile.state_province && profile.city) {
      const stateSlug = generateSlug(profile.state_province);
      const citySlug = generateSlug(profile.city);
      const lastmod = profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : today;

      allUrls.push(createUrlEntry(`${BASE_URL}/premarital-counseling/${stateSlug}/${citySlug}/${profile.slug}`, lastmod, 'monthly', '0.6'));
      profileCount++;
    }
  });

  console.log(`Added ${profileCount} Professional Profiles to sitemap.`);

  // Write the single, clean sitemap
  writeSitemapFile(SITEMAP_PATH, allUrls);
  console.log(`Generated clean sitemap.xml with ${allUrls.length} URLs.`);
  console.log('Sitemap generation complete!');
};

generateSitemap();
