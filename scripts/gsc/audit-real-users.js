/**
 * scripts/gsc/audit-real-users.js
 * 
 * Extracts all "claimed" professional profiles from the Supabase DB
 * and checks their live indexing status on Google Search Console.
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://bkjwctlolhoxhnoospwp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Setup GSC
const SITE_URL = process.env.GSC_SITE_URL;
const WAIT_BETWEEN_REQS_MS = 2000;

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

async function inspectUrl(searchconsole, url) {
    try {
        const response = await searchconsole.urlInspection.index.inspect({
            requestBody: {
                inspectionUrl: url,
                siteUrl: SITE_URL,
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error inspecting ${url}:`, error.message);
        return null;
    }
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function main() {
    console.log('--- Google Search Console: Real Users Indexing Audit ---');

    console.log('1. Pulling verified/claimed profiles from Supabase...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, slug, city, state_province')
        .not('user_id', 'is', null)
        .eq('is_hidden', false)
        .or('moderation_status.eq.approved,moderation_status.is.null');

    if (error) {
        console.error('Error fetching profiles:', error);
        process.exit(1);
    }

    if (!profiles || profiles.length === 0) {
        console.log('No claimed profiles found in the database. Exiting.');
        return;
    }

    console.log(`Found ${profiles.length} real, claimed providers.`);

    // Build the live URLs
    const targetUrls = profiles.map(p => {
        // Generate the canonical URL structure
        const state = p.state_province ? p.state_province.toLowerCase().replace(/\s+/g, '-') : 'unknown';
        const city = p.city ? p.city.toLowerCase().replace(/\s+/g, '-') : 'unknown';
        return `https://www.weddingcounselors.com/premarital-counseling/${state}/${city}/${p.slug}`;
    });

    console.log('\n2. Initializing Google Search Console API...');

    try {
        const auth = await initializeAuth();
        const searchconsole = google.searchconsole({ version: 'v1', auth });

        console.log(`Auth successful. Beginning inspection of ${targetUrls.length} URLs...\n`);

        let passCount = 0;
        let failCount = 0;
        let notIndexedCount = 0;
        const errorSummary = [];

        for (let i = 0; i < targetUrls.length; i++) {
            const url = targetUrls[i];
            console.log(`[${i + 1}/${targetUrls.length}] Inspecting: ${url}`);

            const result = await inspectUrl(searchconsole, url);
            if (result && result.inspectionResult) {
                const r = result.inspectionResult;
                const indexVerdict = r.indexStatusResult?.verdict;
                const coverageState = r.indexStatusResult?.coverageState;
                const schemaVerdict = r.richResultsResult?.verdict || 'N/A';

                console.log(`   └─ Index Status: ${indexVerdict} (${coverageState})`);
                console.log(`   └─ Schema Status: ${schemaVerdict}`);

                if (indexVerdict === 'PASS') {
                    passCount++;
                } else if (indexVerdict === 'NEUTRAL' || indexVerdict === 'FAIL') {
                    notIndexedCount++;
                    errorSummary.push({ url, status: coverageState });
                } else {
                    failCount++;
                }
            } else {
                failCount++;
                console.log(`   └─ API Failed to return data`);
            }

            if (i < targetUrls.length - 1) {
                await sleep(WAIT_BETWEEN_REQS_MS);
            }
        }

        console.log('\n===============================================');
        console.log('              AUDIT SUMMARY                      ');
        console.log('===============================================');
        console.log(`Total "Real User" Profiles Audited:  ${targetUrls.length}`);
        console.log(`Successfully Indexed & Ranking:      ${passCount}`);
        console.log(`Not Indexed (Unknown to Google):     ${notIndexedCount}`);
        console.log(`Error hitting API:                   ${failCount}`);

        if (errorSummary.length > 0) {
            console.log('\n--- Profiles Requiring Attention (Not Indexed) ---');
            console.log('You should force Google to crawl these specific profiles:');
            errorSummary.forEach(e => {
                console.log(`⚠️  ${e.url}`);
                console.log(`   └─ Reason: ${e.status}`);
            });
        }

    } catch (error) {
        console.error('Fatal API Error:', error);
    }
}

main();
