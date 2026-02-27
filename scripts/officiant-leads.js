/**
 * Officiant Lead List Builder
 *
 * Usage:
 *   node scripts/officiant-leads.js              # Preview leads (dry run)
 *   node scripts/officiant-leads.js --import      # Insert into provider_outreach table
 *   node scripts/officiant-leads.js --csv          # Export to CSV file
 *   node scripts/officiant-leads.js --enrich       # Fetch websites to find missing emails
 *   node scripts/officiant-leads.js --enrich --import  # Enrich then import
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const https = require('https');
const http = require('http');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: 'client/.env.local' });

// ─── Configuration ──────────────────────────────────────────────────────────
const CAMPAIGN = 'officiant-outreach-v1';
const DAILY_SEND_LIMIT = 10;

// ─── Scraped Lead Data ──────────────────────────────────────────────────────
// Sources: The Knot, WeddingWire, Eventective, Google, individual websites
// Scraped: Feb 2026
const LEADS = [
  // ═══ DALLAS / FORT WORTH ═══
  { name: 'Latrice Roman', business: 'Put A Ring On It Dallas', email: 'putaringonitdallas@gmail.com', phone: '469-577-9811', website: 'putaringonitdallas.com', city: 'Dallas', state: 'TX' },
  { name: 'Lisa Cage', business: 'Love Your Moment', email: 'info@loveurmoment.com', phone: '844-779-5683', website: 'loveurmoment.com', city: 'Dallas', state: 'TX' },
  { name: 'Richard Richardson', business: 'Dallas Wedding Officiants', email: null, phone: '877-462-7798', website: 'dallasweddingofficiants.com', city: 'Dallas', state: 'TX' },
  { name: 'Stephen Milner', business: 'Texas Wedding Ministers (Dallas)', email: 'contact@txweddingministers.com', phone: '210-802-0097', website: 'txweddingministers.com', city: 'Dallas', state: 'TX' },
  { name: 'Matthew Telepak', business: 'Texas Wedding Ministers (Dallas)', email: 'contact@txweddingministers.com', phone: '210-802-0097', website: 'txweddingministers.com', city: 'Dallas', state: 'TX' },
  { name: 'Vicki High', business: 'Dr. Vicki High (DFW Officiant)', email: null, phone: null, website: null, city: 'Dallas', state: 'TX' },
  { name: 'Julieta Monge', business: 'Texas Wedding Ministers (Dallas)', email: 'contact@txweddingministers.com', phone: '210-802-0097', website: 'txweddingministers.com', city: 'Dallas', state: 'TX' },
  { name: 'Shonda Smith', business: 'Allure Planning Services', email: null, phone: null, website: null, city: 'Dallas', state: 'TX' },
  { name: 'Cintia Ortiz', business: 'Texas Wedding Ministers (Dallas)', email: 'contact@txweddingministers.com', phone: '210-802-0097', website: 'txweddingministers.com', city: 'Dallas', state: 'TX' },
  { name: 'Ben Abuto', business: 'Texas Wedding Ministers (Fort Worth)', email: 'contact@txweddingministers.com', phone: '210-802-0097', website: 'txweddingministers.com', city: 'Fort Worth', state: 'TX' },
  { name: 'Michael Bromberg', business: 'Officiant Michael Bromberg', email: null, phone: null, website: null, city: 'Dallas', state: 'TX' },
  { name: 'Jasmyn', business: 'Joined by Jasmyn (DFW Bilingual)', email: null, phone: null, website: null, city: 'Dallas', state: 'TX', social: '@joinedbyjasmyn' },
  { name: 'Briseida Barbosa', business: 'Officiant Briseida', email: null, phone: null, website: null, city: 'Dallas', state: 'TX', social: '@officiantbriseida' },
  { name: null, business: 'Vow Squad', email: null, phone: null, website: null, city: 'Dallas', state: 'TX' },
  { name: null, business: 'Just Get Hitched LLC', email: null, phone: null, website: null, city: 'Dallas', state: 'TX' },
  { name: null, business: 'Married by Bobbee', email: null, phone: null, website: null, city: 'Dallas', state: 'TX' },
  { name: null, business: 'Crescent Moon Weddings', email: null, phone: null, website: null, city: 'Irving', state: 'TX' },
  { name: null, business: 'LoveNotes', email: null, phone: null, website: null, city: 'Sachse', state: 'TX' },
  { name: null, business: 'Two Rings Wedding Ceremony', email: null, phone: null, website: null, city: 'Flower Mound', state: 'TX' },
  { name: null, business: 'Hometown Wedding Services', email: null, phone: null, website: null, city: 'Arlington', state: 'TX' },
  { name: null, business: 'Anderson Vows & Beyond', email: null, phone: null, website: null, city: 'Red Oak', state: 'TX' },
  { name: null, business: 'Equally Yoked Weddings', email: null, phone: null, website: null, city: 'Frisco', state: 'TX' },
  { name: null, business: 'Ceremony Connection', email: null, phone: null, website: null, city: 'McKinney', state: 'TX' },
  { name: 'Kelli Parker', business: 'Kelli Parker Officiant', email: null, phone: null, website: null, city: 'Princeton', state: 'TX' },
  { name: null, business: 'On This Occasion', email: null, phone: null, website: null, city: 'Cedar Hill', state: 'TX' },

  // ═══ HOUSTON ═══
  { name: null, business: 'Authentic Awakenings', email: null, phone: '713-204-2195', website: 'authenticawakenings.org', city: 'Houston', state: 'TX' },
  { name: 'Laura M. Meehan', business: 'Officiant IN Love', email: 'laura@officiantinlove.com', phone: '720-544-9747', website: 'officiantinlove.com', city: 'Houston', state: 'TX' },
  { name: 'Jay Karahan', business: 'Judge Jay Karahan', email: null, phone: null, website: 'judgejaykarahan.com', city: 'Houston', state: 'TX' },
  { name: null, business: 'Marry Me Houston', email: null, phone: null, website: 'marrymehouston.com', city: 'Houston', state: 'TX' },
  { name: null, business: 'Twin Flames of Texas', email: null, phone: '832-920-9203', website: 'twinflamesoftexas.com', city: 'Houston', state: 'TX' },
  { name: null, business: 'Officially Yours', email: null, phone: '713-591-2411', website: 'officiallyyours.com', city: 'Houston', state: 'TX' },
  { name: null, business: 'Oficiant De Ceremonias', email: 'oficiantedeceremoniastx@gmail.com', phone: '979-406-5118', website: 'oficiantedeceremoniastx.com', city: 'Houston', state: 'TX' },
  { name: 'John Roberts', business: 'Texas Wedding Ministers (Houston)', email: 'contact@txweddingministers.com', phone: '210-802-8097', website: 'txweddingministers.com', city: 'Houston', state: 'TX' },
  { name: 'Kent Gearner', business: 'Texas Wedding Ministers (Houston)', email: 'contact@txweddingministers.com', phone: '210-802-8097', website: 'txweddingministers.com', city: 'Houston', state: 'TX' },
  { name: 'Orlando Felix', business: 'Texas Wedding Ministers (Houston)', email: 'contact@txweddingministers.com', phone: '210-802-8097', website: 'txweddingministers.com', city: 'Houston', state: 'TX' },
  { name: 'Patricia Medina', business: 'Texas Wedding Ministers (Houston)', email: 'contact@txweddingministers.com', phone: '210-802-8097', website: 'txweddingministers.com', city: 'Houston', state: 'TX' },
  { name: 'Stefanie Parker', business: 'Stefanie Parker Officiant', email: null, phone: null, website: null, city: 'Katy', state: 'TX' },
  { name: null, business: 'Silverbell Weddings', email: null, phone: null, website: null, city: 'Houston', state: 'TX' },
  { name: null, business: 'Walker Weddings', email: null, phone: null, website: null, city: 'Houston', state: 'TX' },
  { name: 'Jon Nelson', business: 'Rabbi Jon Nelson', email: null, phone: null, website: null, city: 'Spring', state: 'TX' },
  { name: null, business: 'Wedding Bells Houston', email: null, phone: '281-380-0539', website: null, city: 'Houston', state: 'TX' },
  { name: null, business: 'Bound by Love Ceremonies', email: null, phone: '832-949-3522', website: null, city: 'Houston', state: 'TX' },
  { name: 'Paul House', business: 'Get Married In Houston', email: null, phone: null, website: null, city: 'Houston', state: 'TX' },
  { name: 'Lovethe1urwith', business: 'Love The One You\'re With', email: null, phone: null, website: 'lovethe1urwith.com', city: 'Houston', state: 'TX' },

  // ═══ ATLANTA ═══
  { name: 'Victor J Alvarado', business: 'The Wedding Officiant Group', email: null, phone: '678-382-1394', website: 'theweddingofficiantgroup.com', city: 'Atlanta', state: 'GA' },
  { name: 'Fallon Jones', business: 'The Mobile Officiant Atlanta', email: null, phone: '770-285-7366', website: 'themobileofficiantatlanta.com', city: 'Atlanta', state: 'GA' },
  { name: 'Jemelle Wooten', business: 'The Modern Officiant', email: null, phone: null, website: 'modernofficiant.com', city: 'Atlanta', state: 'GA' },
  { name: 'Rick', business: 'Ceremonies by Rick', email: null, phone: '706-654-6268', website: 'ceremoniesbyrick.com', city: 'Atlanta', state: 'GA' },
  { name: 'Thomas Johnson', business: 'Wedding Ministers & Officiants of Atlanta', email: null, phone: '770-963-7472', website: 'weddingofficiantsatlanta.com', city: 'Atlanta', state: 'GA' },
  { name: 'Birdie James', business: 'Atlanta Wedding Officiant', email: 'ReverendBirdieJames@gmail.com', phone: '706-525-4340', website: 'atlantaweddingofficiant.com', city: 'Atlanta', state: 'GA' },
  { name: 'Tre', business: 'Weddings by Tre', email: null, phone: null, website: 'weddingsbytre.net', city: 'Atlanta', state: 'GA' },
  { name: null, business: 'Atlanta Non-Denominational Wedding Officiants', email: null, phone: null, website: 'atlantaweddingofficiants.com', city: 'Atlanta', state: 'GA' },
  { name: 'Jann Murray', business: 'Atlanta Marry Me', email: null, phone: null, website: null, city: 'Atlanta', state: 'GA' },
  { name: 'Melinda Guess', business: 'Officiant ATL', email: null, phone: null, website: null, city: 'Atlanta', state: 'GA' },
  { name: 'Perry Rintye', business: 'Atlanta Non-Denom Wedding Officiant', email: null, phone: null, website: null, city: 'Atlanta', state: 'GA' },
  { name: 'Nicole', business: 'Marriage Coaches4Life', email: null, phone: null, website: null, city: 'Woodstock', state: 'GA' },
  { name: null, business: 'Soirees by Lee', email: null, phone: null, website: null, city: 'Forest Park', state: 'GA' },
  { name: 'Tamara M. Allen', business: 'Speaking Out! Media', email: null, phone: null, website: null, city: 'Norcross', state: 'GA' },
  { name: null, business: 'Loving Ceremonies', email: null, phone: null, website: null, city: 'Norcross', state: 'GA' },
  { name: null, business: 'Love & Unions', email: null, phone: null, website: null, city: 'Union City', state: 'GA' },
  { name: null, business: 'Forever by Fancy', email: null, phone: null, website: null, city: 'Fayetteville', state: 'GA' },
  { name: 'Jeff Brathwaite', business: 'Winston Ministries', email: null, phone: null, website: null, city: 'Decatur', state: 'GA' },
  { name: null, business: 'Weddings by Randy', email: null, phone: null, website: null, city: 'Marietta', state: 'GA' },
  { name: null, business: 'Atlanta Wedding Reverend', email: null, phone: '770-374-0752', website: null, city: 'Woodstock', state: 'GA' },

  // ═══ NASHVILLE ═══
  { name: 'Zelda Sheldon', business: 'Nashville Wedding Officiant Zelda', email: 'zelda@zeldasheldon.com', phone: '615-720-7192', website: 'nashvilleweddingofficiantzelda.com', city: 'Nashville', state: 'TN' },
  { name: null, business: 'Great Tennessee Officiants', email: 'GreatTNWeddings@gmail.com', phone: '844-933-8697', website: 'greattennesseeofficiants.com', city: 'Nashville', state: 'TN' },
  { name: 'Karen Burns', business: 'Nashville Wedding Ceremony', email: 'nashvilleweddingceremony@gmail.com', phone: '615-812-8901', website: 'nashvilleweddingceremony.com', city: 'Nashville', state: 'TN' },
  { name: 'Benita Livingston', business: 'Living Ceremonies', email: null, phone: null, website: 'livingceremonies.com', city: 'Nashville', state: 'TN' },
  { name: 'Amanda', business: 'Golden Dolphin Weddings', email: null, phone: null, website: 'nashvilleweddingofficiant.com', city: 'Nashville', state: 'TN' },
  { name: 'Todd Rodarmel', business: 'NASHVOWS', email: null, phone: null, website: 'toddrodarmel.com', city: 'Nashville', state: 'TN' },
  { name: 'Eric A. Patton', business: 'Eric A. Patton Officiant', email: null, phone: null, website: 'eapatton.com', city: 'Nashville', state: 'TN' },
  { name: 'Ralph Griggs', business: 'Tennessee Minister', email: null, phone: null, website: 'tennesseeminister.com', city: 'Nashville', state: 'TN' },
  { name: null, business: 'GOD Squad Wedding Ministers Nashville', email: null, phone: null, website: null, city: 'Nashville', state: 'TN' },
  { name: null, business: 'MARRY ME OF TENNESSEE', email: null, phone: null, website: null, city: 'Murfreesboro', state: 'TN' },
  { name: null, business: 'A Brand Nu Day', email: null, phone: null, website: null, city: 'Nashville', state: 'TN' },
  { name: 'Van Riggins', business: 'Van Riggins Wedding Officiant', email: null, phone: null, website: null, city: 'Clarksville', state: 'TN' },
];

// ─── Dedup by email (skip entries sharing the same org email like txweddingministers) ───
function deduplicateLeads(leads) {
  const seen = new Map();
  const deduped = [];

  for (const lead of leads) {
    // If no email, always keep (needs enrichment)
    if (!lead.email) {
      const key = `${(lead.business || '').toLowerCase()}-${lead.city}-${lead.state}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        deduped.push(lead);
      }
      continue;
    }

    // For shared org emails (txweddingministers), keep only one entry per email+city
    const key = `${lead.email.toLowerCase()}-${lead.city}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      deduped.push(lead);
    }
  }

  return deduped;
}

// ─── Website Email Enrichment ───────────────────────────────────────────────
function fetchPage(url, timeout = 8000) {
  return new Promise((resolve) => {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const mod = fullUrl.startsWith('https') ? https : http;

    const req = mod.get(fullUrl, {
      timeout,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadResearch/1.0)' }
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location, timeout).then(resolve);
      }
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(body));
      res.on('error', () => resolve(''));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

function extractEmails(html) {
  // Match emails, exclude common false positives
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex) || [];
  const exclude = ['example.com', 'sentry.io', 'wixpress.com', 'google.com', 'facebook.com', 'schema.org', 'w3.org', 'jquery.com', 'wordpress.org', 'gravatar.com', 'wp.com', 'impallari@', 'user@domain', 'email@', 'name@', 'your@', 'info@example', 'test@', 'noreply@', 'no-reply@', 'wix.com', 'squarespace.com', 'godaddy.com', 'cloudflare.com', 'googleapis.com'];
  return [...new Set(matches.filter(e => !exclude.some(ex => e.includes(ex))))];
}

async function enrichLeads(leads) {
  console.log('\n--- Enriching leads by fetching websites for emails ---');
  let enriched = 0;
  let checked = 0;

  for (const lead of leads) {
    if (lead.email || !lead.website) continue;

    checked++;
    process.stdout.write(`  Fetching ${lead.website}... `);

    const html = await fetchPage(lead.website);
    if (!html) {
      console.log('failed');
      continue;
    }

    const emails = extractEmails(html);
    if (emails.length > 0) {
      lead.email = emails[0]; // Take first non-generic email
      console.log(`found: ${lead.email}`);
      enriched++;
    } else {
      console.log('no email found');
    }

    // Be polite — 1s between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nEnriched ${enriched}/${checked} leads with emails.\n`);
  return leads;
}

// ─── CSV Export ──────────────────────────────────────────────────────────────
function exportCSV(leads, filename) {
  const header = 'name,business,email,phone,website,city,state,campaign,social';
  const rows = leads.map(l => [
    csvEscape(l.name || ''),
    csvEscape(l.business || ''),
    csvEscape(l.email || ''),
    csvEscape(l.phone || ''),
    csvEscape(l.website || ''),
    csvEscape(l.city),
    csvEscape(l.state),
    CAMPAIGN,
    csvEscape(l.social || '')
  ].join(','));

  const csv = [header, ...rows].join('\n');
  fs.writeFileSync(filename, csv);
  console.log(`\nExported ${leads.length} leads to ${filename}`);
}

function csvEscape(val) {
  if (!val) return '';
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

// ─── Supabase Import ────────────────────────────────────────────────────────
async function importToSupabase(leads) {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing REACT_APP_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Only import leads that have emails
  const withEmail = leads.filter(l => l.email);
  const noEmail = leads.filter(l => !l.email);

  console.log(`\n--- Importing to provider_outreach ---`);
  console.log(`  ${withEmail.length} leads with email (will import)`);
  console.log(`  ${noEmail.length} leads without email (skipped — run --enrich first)`);

  if (withEmail.length === 0) {
    console.log('No leads with emails to import. Run with --enrich first.');
    return;
  }

  // Check for existing entries to avoid dupes
  const emails = withEmail.map(l => l.email.toLowerCase());
  const { data: existing } = await supabase
    .from('provider_outreach')
    .select('email')
    .in('email', emails);

  const existingEmails = new Set((existing || []).map(e => e.email.toLowerCase()));
  const newLeads = withEmail.filter(l => !existingEmails.has(l.email.toLowerCase()));

  console.log(`  ${existingEmails.size} already in database (skipping)`);
  console.log(`  ${newLeads.length} new leads to insert`);

  if (newLeads.length === 0) {
    console.log('All leads already exist in database.');
    return;
  }

  const rows = newLeads.map(l => ({
    email: l.email,
    name: l.name || l.business,
    website: l.website ? (l.website.startsWith('http') ? l.website : `https://${l.website}`) : null,
    city: l.city,
    state: l.state,
    outreach_status: 'identified',
    notes: `[${CAMPAIGN}] ${l.business || ''}${l.phone ? ' | Phone: ' + l.phone : ''}${l.social ? ' | IG: ' + l.social : ''}`
  }));

  const { data, error } = await supabase
    .from('provider_outreach')
    .insert(rows)
    .select('id, email, name, city');

  if (error) {
    console.error('Import error:', error);
    return;
  }

  console.log(`\nInserted ${data.length} leads into provider_outreach:`);
  data.forEach(r => console.log(`  + ${r.name} (${r.email}) — ${r.city}`));
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const doEnrich = args.includes('--enrich');
  const doImport = args.includes('--import');
  const doCSV = args.includes('--csv');

  let leads = deduplicateLeads(LEADS);

  console.log('==========================================================');
  console.log(`  OFFICIANT LEAD LIST — ${CAMPAIGN}`);
  console.log('==========================================================');
  console.log(`\nTotal leads: ${leads.length} (after dedup)`);

  const withEmail = leads.filter(l => l.email);
  const noEmail = leads.filter(l => !l.email);
  const withWebsite = noEmail.filter(l => l.website);

  console.log(`  With email: ${withEmail.length} (ready to outreach)`);
  console.log(`  No email, has website: ${withWebsite.length} (enrichable)`);
  console.log(`  No email, no website: ${noEmail.length - withWebsite.length} (need manual lookup)`);

  // City breakdown
  const byCityState = {};
  leads.forEach(l => {
    const key = `${l.city}, ${l.state}`;
    byCityState[key] = (byCityState[key] || 0) + 1;
  });
  console.log('\nBy city:');
  Object.entries(byCityState).sort((a, b) => b[1] - a[1]).forEach(([city, count]) => {
    console.log(`  ${city}: ${count}`);
  });

  // Enrich
  if (doEnrich) {
    leads = await enrichLeads(leads);
  }

  // Show actionable leads
  const actionable = leads.filter(l => l.email);
  console.log(`\n--- Actionable leads (have email): ${actionable.length} ---`);
  actionable.forEach((l, i) => {
    console.log(`  ${i + 1}. ${l.name || l.business} | ${l.email} | ${l.city}, ${l.state}`);
  });

  console.log(`\nAt ${DAILY_SEND_LIMIT}/day, this list covers ${Math.ceil(actionable.length / DAILY_SEND_LIMIT)} days of outreach.`);

  // Export
  if (doCSV) {
    exportCSV(leads, 'scripts/officiant-leads.csv');
  }

  // Import
  if (doImport) {
    await importToSupabase(leads);
  }

  if (!doEnrich && !doImport && !doCSV) {
    console.log('\nDry run complete. Use flags to take action:');
    console.log('  --enrich   Fetch websites to find missing emails');
    console.log('  --csv      Export all leads to CSV');
    console.log('  --import   Insert email-ready leads into provider_outreach');
  }
}

main().catch(console.error);
