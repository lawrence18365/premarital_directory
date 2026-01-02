/**
 * Email Finder Tool
 *
 * Finds publicly available emails from counselor websites.
 * Only scrapes public website data - no private databases.
 *
 * Usage: node find-emails.js "https://counselor-website.com"
 */

const https = require('https');
const http = require('http');

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Common pages to check for contact info
const CONTACT_PATHS = [
  '/',
  '/contact',
  '/contact-us',
  '/about',
  '/about-us',
  '/connect',
  '/get-in-touch'
];

/**
 * Fetch page content
 */
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DirectoryBot/1.0)'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        fetchPage(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        resolve('');
        return;
      }

      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve(data));
    });

    request.on('error', () => resolve(''));
    request.on('timeout', () => {
      request.destroy();
      resolve('');
    });
  });
}

/**
 * Extract emails from HTML content
 */
function extractEmails(html) {
  const matches = html.match(EMAIL_REGEX) || [];

  // Filter out common false positives
  const filtered = matches.filter(email => {
    const lower = email.toLowerCase();
    // Skip image files, common placeholders
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.gif')) return false;
    if (lower.includes('example.com') || lower.includes('domain.com')) return false;
    if (lower.includes('wordpress') || lower.includes('wix')) return false;
    if (lower.startsWith('info@') && lower.includes('schema')) return false;
    return true;
  });

  // Dedupe and return
  return [...new Set(filtered)];
}

/**
 * Find emails from a website
 */
async function findEmailsFromWebsite(baseUrl) {
  // Normalize URL
  if (!baseUrl.startsWith('http')) {
    baseUrl = 'https://' + baseUrl;
  }
  baseUrl = baseUrl.replace(/\/$/, '');

  console.log(`\nSearching ${baseUrl} for email addresses...\n`);

  const allEmails = new Set();

  for (const path of CONTACT_PATHS) {
    const url = baseUrl + path;
    try {
      const html = await fetchPage(url);
      const emails = extractEmails(html);

      if (emails.length > 0) {
        console.log(`  Found on ${path}: ${emails.join(', ')}`);
        emails.forEach(e => allEmails.add(e));
      }
    } catch (err) {
      // Silently continue
    }
  }

  if (allEmails.size === 0) {
    console.log('  No emails found on common pages.');
    console.log('  Try checking the website manually for contact forms or social links.');
  }

  return [...allEmails];
}

/**
 * Batch find emails from multiple websites
 */
async function batchFindEmails(websites) {
  const results = [];

  for (const website of websites) {
    const emails = await findEmailsFromWebsite(website);
    results.push({
      website,
      emails
    });

    // Rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  return results;
}

/**
 * Alternative: Hunter.io API (has free tier - 25 searches/month)
 * Sign up at hunter.io and get API key
 */
async function hunterEmailFinder(domain, apiKey) {
  const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}`;

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          const emails = result.data?.emails?.map(e => e.value) || [];
          resolve(emails);
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Email Finder Tool

Usage:
  node find-emails.js https://counselor-website.com
  node find-emails.js batch websites.txt
  node find-emails.js hunter domain.com YOUR_API_KEY

Examples:
  node find-emails.js https://austin-therapy.com

The tool checks common pages (/contact, /about, etc.) for email addresses.
Only finds publicly displayed emails - nothing private.
  `);
} else if (args[0] === 'batch' && args[1]) {
  // Batch mode from file
  const fs = require('fs');
  const websites = fs.readFileSync(args[1], 'utf8').split('\n').filter(Boolean);
  batchFindEmails(websites).then(results => {
    console.log('\n=== Results ===\n');
    results.forEach(r => {
      if (r.emails.length > 0) {
        console.log(`${r.website}: ${r.emails.join(', ')}`);
      }
    });
  });
} else if (args[0] === 'hunter' && args[1] && args[2]) {
  // Hunter.io mode
  hunterEmailFinder(args[1], args[2]).then(emails => {
    console.log(`Emails found via Hunter.io: ${emails.join(', ') || 'none'}`);
  });
} else {
  // Single website
  findEmailsFromWebsite(args[0]).then(emails => {
    console.log(`\n=== Found ${emails.length} email(s) ===`);
    emails.forEach(e => console.log(`  ${e}`));
  });
}

module.exports = {
  findEmailsFromWebsite,
  batchFindEmails,
  hunterEmailFinder
};
