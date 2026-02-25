/**
 * scripts/gsc/score-opportunities.js
 * 
 * Scores and categorizes GSC queries/pages as low-hanging fruit opportunities.
 * Outputs a JSON report with scored & ranked opportunities.
 *
 * Run: node scripts/gsc/score-opportunities.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

function loadJSON(filename) {
    return JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, filename), 'utf8'));
}

function scoreQuery(r) {
    let score = 0;
    const q = r.query.toLowerCase();

    // 1. Impression volume (max 30 pts)
    score += Math.min(30, r.impressions * 0.5);

    // 2. Position proximity to page 1 (max 35 pts) - closer = easier win
    if (r.position <= 10) score += 35;
    else if (r.position <= 20) score += 30 - (r.position - 10);
    else if (r.position <= 30) score += 20 - (r.position - 20) * 0.5;
    else if (r.position <= 50) score += 15 - (r.position - 30) * 0.3;
    else score += Math.max(0, 9 - (r.position - 50) * 0.15);

    // 3. Intent signal (max 20 pts)
    if (/premarital|pre-marital|marriage prep/.test(q)) score += 20;
    else if (/marriage counseling|couples counseling|couples therapy/.test(q)) score += 15;
    else if (/counseling|counselor|therapist|therapy/.test(q)) score += 12;
    else if (/wedding|marriage/.test(q)) score += 10;

    // Name-only searches get penalized
    const isNameOnly = /^[a-z]+ [a-z]+$/i.test(q) && !/counseling|therapy|counselor/.test(q);
    if (isNameOnly) score -= 10;

    // 4. Local intent bonus (max 10 pts)
    if (/near me/.test(q)) score += 10;
    const hasLocation = q.split(' ').length >= 3 && /counseling|therapy|counselor|therapist|premarital/.test(q);
    if (hasLocation) score += 5;

    // 5. CTR gap (on page 1 but 0% CTR means title/desc fix opportunity)
    if (r.position <= 10 && r.ctr === 0 && r.impressions >= 10) score += 5;

    // 6. Proven converter bonus
    score += r.clicks * 3;

    // Classify
    let category = 'Other';
    if (isNameOnly) category = 'Name Search';
    else if (/premarital|pre-marital|marriage prep/.test(q)) category = 'Premarital + Location';
    else if (/marriage counsel/.test(q)) category = 'Marriage Counseling';
    else if (/gottman|prepare.enrich|emotionally focused/.test(q)) category = 'Method-Specific';
    else if (/christian|catholic|biblical|faith/.test(q)) category = 'Faith-Based';
    else if (/online|virtual|telehealth/.test(q)) category = 'Online/Virtual';
    else if (/discount|cost|affordable|cheap|free|price|certificate/.test(q)) category = 'Cost/Discount';
    else if (/lgbtq/.test(q)) category = 'LGBTQ+';
    else if (/counseling|counselor|therapist|therapy/.test(q)) category = 'General Counseling';

    // Difficulty estimate
    let difficulty = 'Hard';
    if (r.position <= 10) difficulty = 'Easy';
    else if (r.position <= 20) difficulty = 'Medium';
    else if (r.position <= 35) difficulty = 'Medium-Hard';

    return { ...r, score: Math.round(score * 10) / 10, category, difficulty };
}

function scorePage(r) {
    let score = 0;
    score += Math.min(30, r.impressions * 0.3);
    if (r.position <= 10) score += 35;
    else if (r.position <= 20) score += 25;
    else if (r.position <= 30) score += 15;
    else if (r.position <= 50) score += 8;
    else score += 3;
    if (r.position <= 20 && r.ctr < 2 && r.impressions >= 20) score += 10;
    score += r.clicks * 5;
    const url = r.page.toLowerCase();
    if (url.includes('marriage-license-discount')) score += 10;
    if (url.includes('/premarital-counseling/')) score += 5;
    return { ...r, score: Math.round(score * 10) / 10, shortUrl: r.page.replace('https://www.weddingcounselors.com', '') };
}

// Load data
const queries = loadJSON('queries.json');
const pages = loadJSON('pages.json');
const combined = loadJSON('combined.json');

// Load true totals (from dimensionless API query — no anonymization loss)
let trueTotalsData;
try {
    trueTotalsData = loadJSON('totals.json');
} catch {
    trueTotalsData = null;
}

// Score
const scoredQueries = queries.map(scoreQuery).sort((a, b) => b.score - a.score);
const scoredPages = pages.map(scorePage).sort((a, b) => b.score - a.score);

// Totals — use true totals if available, otherwise fall back to row sums (which undercount)
const rowClicks = queries.reduce((s, r) => s + r.clicks, 0);
const rowImpressions = queries.reduce((s, r) => s + r.impressions, 0);
const totals = trueTotalsData ? {
    totalClicks: trueTotalsData.trueTotals.clicks,
    totalImpressions: trueTotalsData.trueTotals.impressions,
    avgCTR: trueTotalsData.trueTotals.ctr + '%',
    avgPosition: trueTotalsData.trueTotals.position,
    totalQueries: queries.length,
    totalPages: pages.length,
    rowCoverage: trueTotalsData.rowCoverage,
    source: 'true_totals (dimensionless API query)',
} : {
    totalClicks: rowClicks,
    totalImpressions: rowImpressions,
    avgCTR: (rowClicks / rowImpressions * 100).toFixed(2) + '%',
    totalQueries: queries.length,
    totalPages: pages.length,
    source: 'row_sums (may undercount — run pull-data.js to get true totals)',
};

// Category summary
const catMap = {};
scoredQueries.forEach(r => {
    if (!catMap[r.category]) catMap[r.category] = { queries: 0, impressions: 0, clicks: 0, avgPos: 0, avgScore: 0 };
    catMap[r.category].queries++;
    catMap[r.category].impressions += r.impressions;
    catMap[r.category].clicks += r.clicks;
    catMap[r.category].avgPos += r.position;
    catMap[r.category].avgScore += r.score;
});
Object.entries(catMap).forEach(([k, v]) => {
    v.avgPos = (v.avgPos / v.queries).toFixed(1);
    v.avgScore = (v.avgScore / v.queries).toFixed(1);
});

const report = {
    pullDate: new Date().toISOString().split('T')[0],
    dateRange: trueTotalsData ? `${trueTotalsData.dateRange.start} → ${trueTotalsData.dateRange.end}` : 'unknown (re-run pull-data.js)',
    totals,
    categoryBreakdown: catMap,
    top40Queries: scoredQueries.slice(0, 40),
    top20Pages: scoredPages.slice(0, 20),
    nearWinQueries: scoredQueries.filter(r => r.position <= 20 && r.impressions >= 5 && r.category !== 'Name Search'),
    highImpLowRank: scoredQueries.filter(r => r.impressions >= 20 && r.position >= 20).sort((a, b) => b.impressions - a.impressions).slice(0, 20),
};

// Save
const outFile = path.join(OUTPUT_DIR, 'scored-opportunities.json');
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log('Saved scored report to', outFile);

// Print summary
console.log('\n=== SITE OVERVIEW (28 days) ===');
console.log(JSON.stringify(totals, null, 2));

console.log('\n=== CATEGORY BREAKDOWN ===');
Object.entries(catMap).sort((a, b) => b[1].impressions - a[1].impressions).forEach(([cat, v]) => {
    console.log(`${cat}: ${v.queries} queries | ${v.impressions} imps | ${v.clicks} clicks | avgPos: ${v.avgPos} | avgScore: ${v.avgScore}`);
});

console.log('\n=== TOP 40 SCORED QUERIES ===');
console.log('Score | Diff | Pos | Imps | Clicks | Category | Query');
scoredQueries.slice(0, 40).forEach(r => {
    console.log(`${r.score} | ${r.difficulty} | ${r.position} | ${r.impressions} | ${r.clicks} | ${r.category} | ${r.query}`);
});

console.log('\n=== TOP 20 SCORED PAGES ===');
console.log('Score | Pos | Imps | Clicks | CTR | URL');
scoredPages.slice(0, 20).forEach(r => {
    console.log(`${r.score} | ${r.position} | ${r.impressions} | ${r.clicks} | ${r.ctr}% | ${r.shortUrl}`);
});

console.log('\n=== NEAR-WIN SERVICE QUERIES (pos<=20, 5+ imps, not name searches) ===');
report.nearWinQueries.forEach(r => {
    console.log(`${r.score} | ${r.difficulty} | pos ${r.position} | ${r.impressions} imps | ${r.query}`);
});

console.log('\n=== HIGH IMPRESSIONS BUT LOW RANK (20+ imps, pos>20) ===');
report.highImpLowRank.forEach(r => {
    console.log(`${r.score} | pos ${r.position} | ${r.impressions} imps | ${r.query}`);
});
