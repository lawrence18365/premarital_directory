/**
 * scripts/gsc/submit-sitemap.js
 * 
 * Uses the Google Search Console API to programmatically submit your sitemap
 * and retrieve any processing errors or warnings.
 * 
 * Run this immediately after deploying massive architectural changes or new 
 * programmatic pages to force Google to find them.
 */

import 'dotenv/config';
import { google } from 'googleapis';

const SITE_URL = process.env.GSC_SITE_URL;
const SITEMAP_URL = 'https://www.weddingcounselors.com/sitemap.xml';

if (!SITE_URL) {
    console.error("ERROR: GSC_SITE_URL must be set in .env (e.g., sc-domain:weddingcounselors.com)");
    process.exit(1);
}

async function initializeAuth() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
        throw new Error('Missing Google Auth credentials in .env');
    }

    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        'http://localhost:3001/oauth2callback'
    );

    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    return oauth2Client;
}

async function main() {
    console.log('--- Google Search Console Automated Sitemap Submission ---');
    console.log(`Target Site: ${SITE_URL}`);
    console.log(`Sitemap URL: ${SITEMAP_URL}`);

    try {
        console.log('Initializing API auth...');
        const auth = await initializeAuth();
        const searchconsole = google.searchconsole({ version: 'v1', auth });

        // 1. Submit the Sitemap
        console.log('\nSubmitting sitemap to Google...');
        await searchconsole.sitemaps.submit({
            siteUrl: SITE_URL,
            feedpath: SITEMAP_URL
        });
        console.log('✅ Submission successful. Google has been pinged.');

        console.log('\nRetrieving latest sitemap processing status...');
        // Add a tiny delay to give Google a millisecond to register the ping before we read the status
        await new Promise(res => setTimeout(res, 2000));

        // 2. Retrieve Sitemap Status
        const response = await searchconsole.sitemaps.get({
            siteUrl: SITE_URL,
            feedpath: SITEMAP_URL
        });

        const sitemapData = response.data;

        console.log('\n===============================================');
        console.log('             SITEMAP DIAGNOSTICS                 ');
        console.log('===============================================');
        console.log(`Type:          ${sitemapData.type || 'Unknown'}`);
        console.log(`Is Pending:    ${sitemapData.isPending ? 'Yes' : 'No'}`);
        console.log(`Is Sitemap:    ${sitemapData.isSitemapsIndex ? 'Index File' : 'Standard XML'}`);
        if (sitemapData.lastSubmitted) {
            console.log(`Submitted:     ${new Date(sitemapData.lastSubmitted).toLocaleString()}`);
        }
        if (sitemapData.lastDownloaded) {
            console.log(`Downloaded:    ${new Date(sitemapData.lastDownloaded).toLocaleString()}`);
        }

        // 3. Evaluate Errors/Warnings
        const errors = sitemapData.errors || 0;
        const warnings = sitemapData.warnings || 0;

        console.log();
        if (errors === 0 && warnings === 0) {
            console.log('✅ Status: PERFECT (0 Errors, 0 Warnings)');
        } else {
            if (errors > 0) console.log(`❌ CRITICAL ERRORS: ${errors}`);
            if (warnings > 0) console.log(`⚠️  Warnings: ${warnings}`);
            console.log('\nGo to your Google Search Console dashboard to investigate these formatting issues.');
        }
        console.log('===============================================\n');

    } catch (error) {
        console.error('\nFatal Error:', error.message);
        if (error.response && error.response.data && error.response.data.error) {
            console.error('API Context:', error.response.data.error.message);
        }
    }
}

main();
