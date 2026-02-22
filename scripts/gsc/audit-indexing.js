/**
 * scripts/gsc/audit-indexing.js
 * 
 * Uses the Google Search Console URL Inspection API to check the indexing 
 * status of specific URLs on the platform. This is highly useful for 
 * instantly detecting Soft 404s, mobile usability errors, or schema 
 * (Rich Result) issues without waiting for organic crawl logs.
 */

import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE_URL = process.env.GSC_SITE_URL;

if (!SITE_URL) {
    console.error("ERROR: GSC_SITE_URL must be set in .env (e.g., sc-domain:weddingcounselors.com)");
    process.exit(1);
}

// Fallback manual list (mostly useful for testing)
const FALLBACK_URLS = [
    'https://www.weddingcounselors.com/premarital-counseling/texas/dallas',
    'https://www.weddingcounselors.com/premarital-counseling/california/los-angeles',
    'https://www.weddingcounselors.com/premarital-counseling/marriage-license-discount/texas',
];

// Number of top URLs to inspect automatically from the GSC export
const INSPECT_LIMIT = 10;
const WAIT_BETWEEN_REQS_MS = 2000; // API has strict quotas (~600/min)

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

function parseInspectionResult(url, data) {
    if (!data || !data.inspectionResult) return;

    const result = data.inspectionResult;
    const indexStatus = result.indexStatusResult;
    const mobileStatus = result.mobileUsabilityResult;
    const richResults = result.richResultsResult;

    console.log(`\n=== Inspection Result for: ${url} ===`);

    // 1. Core Indexing Status
    console.log(`\nIndexing Status: ${indexStatus.verdict}`);
    console.log(`Coverage State: ${indexStatus.coverageState}`);

    if (indexStatus.pageFetchState) {
        console.log(`Fetch State: ${indexStatus.pageFetchState}`);
    }

    if (indexStatus.lastCrawlTime) {
        console.log(`Last Crawled: ${new Date(indexStatus.lastCrawlTime).toLocaleString()}`);
    }

    if (indexStatus.sitemap && indexStatus.sitemap.length > 0) {
        console.log(`Found in Sitemaps: ${indexStatus.sitemap.join(', ')}`);
    }

    // 2. Mobile Usability
    if (mobileStatus) {
        console.log(`\nMobile Usability: ${mobileStatus.verdict}`);
        if (mobileStatus.issues && mobileStatus.issues.length > 0) {
            console.log('Mobile Issues:');
            mobileStatus.issues.forEach(issue => console.log(`  - ${issue.issueType}: ${issue.resolution}`));
        }
    }

    // 3. Rich Results (Schema)
    if (richResults) {
        console.log(`\nRich Results (Schema): ${richResults.verdict}`);
        if (richResults.detectedItems && richResults.detectedItems.length > 0) {
            console.log('Detected Schema Types:');
            richResults.detectedItems.forEach(item => {
                console.log(`  - [${item.richResultType}] Items: ${item.name || 'Unnamed'}`);
            });
        }
    }
    console.log('===============================================\n');
}

function getTargetUrls() {
    const pagesFile = path.join(__dirname, 'output', 'pages.json');
    try {
        if (fs.existsSync(pagesFile)) {
            const data = JSON.parse(fs.readFileSync(pagesFile, 'utf-8'));
            // Sort by impressions to check most important pages first
            const sorted = data.sort((a, b) => b.impressions - a.impressions);
            const urls = sorted.slice(0, INSPECT_LIMIT).map(r => r.page);

            console.log(`Found GSC pages export. Taking top ${urls.length} URLs by impression volume.`);
            return urls;
        }
    } catch (err) {
        console.warn(`Could not read ${pagesFile}, falling back to manual list.`);
    }

    console.log('No GSC export found. Using fallback hardcoded list.');
    return FALLBACK_URLS;
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function main() {
    console.log('--- Google Search Console Automated URL Audit ---');

    const targetUrls = getTargetUrls();
    if (targetUrls.length === 0) {
        console.log('No URLs to test. Exiting.');
        return;
    }

    console.log('Initializing API auth...');

    try {
        const auth = await initializeAuth();
        const searchconsole = google.searchconsole({ version: 'v1', auth });

        console.log(`Auth successful. Beginning inspection of ${targetUrls.length} URLs...\n`);

        let passCount = 0;
        let failCount = 0;
        const errorSummary = [];

        for (let i = 0; i < targetUrls.length; i++) {
            const url = targetUrls[i];
            console.log(`[${i + 1}/${targetUrls.length}] Inspecting: ${url}`);

            const result = await inspectUrl(searchconsole, url);
            if (result && result.inspectionResult) {
                parseInspectionResult(url, result);

                const r = result.inspectionResult;
                const indexPass = r.indexStatusResult?.verdict === 'PASS';
                const schemaPass = !r.richResultsResult || r.richResultsResult.verdict === 'PASS';
                const mobilePass = !r.mobileUsabilityResult || r.mobileUsabilityResult.verdict === 'PASS';

                if (indexPass && schemaPass && mobilePass) {
                    passCount++;
                } else {
                    failCount++;
                    errorSummary.push({
                        url,
                        index: r.indexStatusResult?.verdict,
                        schema: r.richResultsResult?.verdict || 'N/A',
                        mobile: r.mobileUsabilityResult?.verdict || 'N/A'
                    });
                }
            } else {
                failCount++;
                errorSummary.push({ url, error: 'API Request Failed' });
            }

            if (i < targetUrls.length - 1) {
                await sleep(WAIT_BETWEEN_REQS_MS);
            }
        }

        console.log('\n===============================================');
        console.log('              AUDIT SUMMARY                      ');
        console.log('===============================================');
        console.log(`Total URLs Audited:  ${targetUrls.length}`);
        console.log(`Fully Passed:        ${passCount}`);
        console.log(`Had Issue/Warning:   ${failCount}`);

        if (errorSummary.length > 0) {
            console.log('\n--- URLs Requiring Attention ---');
            errorSummary.forEach(e => {
                if (e.error) {
                    console.log(`❌ ${e.url} (Error: ${e.error})`);
                } else {
                    console.log(`⚠️  ${e.url}`);
                    console.log(`   - Indexing: ${e.index}`);
                    console.log(`   - Mobile:   ${e.mobile}`);
                    console.log(`   - Schema:   ${e.schema}`);
                }
            });
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

main();
