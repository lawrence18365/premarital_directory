const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: [path.resolve(__dirname, '../.env.local'), path.resolve(__dirname, '../.env')] });

const BASE_URL = 'https://weddingcounselors.com';
const PUBLIC_DIR = path.join(__dirname, '../client/public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const MAX_URLS = 500; // Keep the sitemap focused on top URLs for now

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
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
  console.log('Starting clean sitemap generation...');
  const today = new Date().toISOString().split('T')[0];
  const allUrls = [];

  // 1. Add static pages with high priority
  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/pricing',
    '/features',
    '/guidelines',
    '/privacy',
    '/terms',
    '/states'
  ];
  staticPages.forEach(url => {
    allUrls.push(createUrlEntry(`${BASE_URL}${url}`, today, 'weekly', '1.0'));
  });

  // 2. Add state pages
  const { data: states, error: statesError } = await supabase
    .from('profiles')
    .select('state_province', { count: 'exact', head: false });

  if (statesError) {
    console.error('Error fetching states:', statesError);
    return;
  }

  const uniqueStates = [...new Set(states.map(s => s.state_province).filter(Boolean))];
  uniqueStates.forEach(state => {
    const stateSlug = state.toLowerCase().replace(/\s+/g, '-');
    allUrls.push(createUrlEntry(`${BASE_URL}/professionals/${stateSlug}`, today, 'daily', '0.9'));
  });

  // 3. Add top professional profiles (most recently updated or created)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('slug, state_province, created_at, updated_at')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(MAX_URLS - allUrls.length);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }

  profiles
    .filter(p => p.slug && p.state_province)
    .forEach(profile => {
      const stateSlug = profile.state_province.toLowerCase().replace(/\s+/g, '-');
      const lastmod = profile.updated_at ? new Date(profile.updated_at).toISOString().split('T')[0] : today;
      allUrls.push(createUrlEntry(`${BASE_URL}/professionals/${stateSlug}/${profile.slug}`, lastmod, 'monthly', '0.8'));
    });

  // 4. Write the single, clean sitemap
  writeSitemapFile(SITEMAP_PATH, allUrls);
  console.log(`Generated clean sitemap.xml with ${allUrls.length} URLs.`);
  console.log('Sitemap generation complete!');
};

generateSitemap();
