/**
 * scripts/ga/seo-opportunities.js
 *
 * Cross-references GSC search data with GA4 engagement data to find
 * the best SEO opportunities — pages that are close to ranking well
 * and already have good user engagement.
 *
 * Usage: node scripts/ga/seo-opportunities.js
 */

import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const GA_PROPERTY_ID = '501043083';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });
const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

async function main() {
  // ═══ Pull GSC Page Data (28 days) ═══
  console.log('Pulling GSC page performance...');
  const gscPages = await searchconsole.searchanalytics.query({
    siteUrl: process.env.GSC_SITE_URL,
    requestBody: {
      startDate: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      dimensions: ['page'],
      rowLimit: 500,
    },
  });

  const gscByPath = {};
  (gscPages.data.rows || []).forEach(r => {
    const url = r.keys[0];
    const path = url.replace('https://www.weddingcounselors.com', '') || '/';
    gscByPath[path] = {
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    };
  });

  // ═══ Pull GSC Query Data (28 days) ═══
  console.log('Pulling GSC query data...');
  const gscQueries = await searchconsole.searchanalytics.query({
    siteUrl: process.env.GSC_SITE_URL,
    requestBody: {
      startDate: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      dimensions: ['query', 'page'],
      rowLimit: 1000,
    },
  });

  // ═══ Pull GA4 Page Engagement (28 days) ═══
  console.log('Pulling GA4 engagement data...');
  const gaRes = await analyticsData.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'engagedSessions' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 500,
    },
  });

  const gaByPath = {};
  (gaRes.data.rows || []).forEach(r => {
    const path = r.dimensionValues[0].value;
    gaByPath[path] = {
      views: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
      avgDuration: parseFloat(r.metricValues[2].value),
      bounceRate: parseFloat(r.metricValues[3].value),
      engagedSessions: parseInt(r.metricValues[4].value),
    };
  });

  // ═══ Score Opportunities ═══
  console.log('Scoring opportunities...\n');

  const opportunities = [];

  Object.entries(gscByPath).forEach(([path, gsc]) => {
    const ga = gaByPath[path];

    // Skip professional pages, admin pages, etc.
    if (path.startsWith('/professional/') || path.startsWith('/admin/')) return;

    // Calculate opportunity score
    // High score = high impressions + close to page 1 + good engagement
    let score = 0;

    // Impression weight (more impressions = more potential)
    score += Math.min(gsc.impressions / 10, 30);

    // Position proximity to page 1 (positions 8-30 are "striking distance")
    if (gsc.position <= 10) score += 40;
    else if (gsc.position <= 20) score += 30;
    else if (gsc.position <= 30) score += 20;
    else if (gsc.position <= 50) score += 10;

    // Engagement bonus (if GA data exists and shows good engagement)
    if (ga) {
      if (ga.bounceRate < 0.3) score += 15;
      else if (ga.bounceRate < 0.5) score += 5;

      if (ga.avgDuration > 120) score += 10;
      else if (ga.avgDuration > 60) score += 5;
    }

    // CTR gap (low CTR at good position = title/meta issue)
    const expectedCtr = gsc.position <= 3 ? 0.15 : gsc.position <= 5 ? 0.08 : gsc.position <= 10 ? 0.04 : 0.02;
    const ctrGap = expectedCtr - gsc.ctr;

    // Classify the opportunity
    let type = 'general';
    let recommendation = '';

    if (gsc.position <= 10 && ctrGap > 0.02) {
      type = 'title_rewrite';
      recommendation = `Position ${gsc.position.toFixed(1)} but only ${(gsc.ctr * 100).toFixed(1)}% CTR. Rewrite title/meta description.`;
      score += 15;
    } else if (gsc.position > 10 && gsc.position <= 20 && gsc.impressions > 20) {
      type = 'almost_page_1';
      recommendation = `Position ${gsc.position.toFixed(1)} with ${gsc.impressions} impressions. A few backlinks or content improvements could push to page 1.`;
      score += 10;
    } else if (gsc.position > 20 && gsc.position <= 40 && gsc.impressions > 50) {
      type = 'content_opportunity';
      recommendation = `High impressions (${gsc.impressions}) at position ${gsc.position.toFixed(1)}. Needs content depth + backlinks.`;
    } else if (ga && ga.bounceRate > 0.5) {
      type = 'high_bounce';
      recommendation = `${Math.round(ga.bounceRate * 100)}% bounce rate. Page content doesn't match search intent.`;
    }

    opportunities.push({
      path,
      gsc: {
        clicks: gsc.clicks,
        impressions: gsc.impressions,
        ctr: Math.round(gsc.ctr * 10000) / 100,
        position: Math.round(gsc.position * 10) / 10,
      },
      ga: ga ? {
        views: ga.views,
        users: ga.users,
        avgDuration: Math.round(ga.avgDuration),
        bounceRate: Math.round(ga.bounceRate * 100),
        engagedSessions: ga.engagedSessions,
      } : null,
      score: Math.round(score),
      type,
      recommendation,
    });
  });

  // Sort by score
  opportunities.sort((a, b) => b.score - a.score);

  // ═══ Group query → page mappings for top opportunities ═══
  const queryMap = {};
  (gscQueries.data.rows || []).forEach(r => {
    const query = r.keys[0];
    const url = r.keys[1];
    const path = url.replace('https://www.weddingcounselors.com', '') || '/';
    if (!queryMap[path]) queryMap[path] = [];
    queryMap[path].push({
      query,
      clicks: r.clicks,
      impressions: r.impressions,
      position: Math.round(r.position * 10) / 10,
    });
  });

  // Attach queries to top opportunities
  opportunities.slice(0, 30).forEach(opp => {
    opp.queries = (queryMap[opp.path] || [])
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5);
  });

  // ═══ Output ═══
  const output = {
    generatedAt: new Date().toISOString(),
    totalOpportunities: opportunities.length,
    opportunities: opportunities.slice(0, 50),
  };

  const outputPath = path.join(OUTPUT_DIR, 'seo-opportunities.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log('Saved to:', outputPath);

  // Print top opportunities
  console.log('\n' + '═'.repeat(70));
  console.log('  TOP SEO OPPORTUNITIES');
  console.log('═'.repeat(70));

  const titleRewrites = opportunities.filter(o => o.type === 'title_rewrite');
  const almostPage1 = opportunities.filter(o => o.type === 'almost_page_1');
  const contentOpps = opportunities.filter(o => o.type === 'content_opportunity');
  const highBounce = opportunities.filter(o => o.type === 'high_bounce');

  if (titleRewrites.length > 0) {
    console.log('\n🔴 TITLE/META REWRITES (ranking well but low CTR):');
    titleRewrites.slice(0, 5).forEach(o => {
      console.log(`  ${o.path}`);
      console.log(`    Pos: ${o.gsc.position} | Imp: ${o.gsc.impressions} | CTR: ${o.gsc.ctr}% | ${o.recommendation}`);
      if (o.queries?.length) {
        console.log(`    Queries: ${o.queries.map(q => '"' + q.query + '"').join(', ')}`);
      }
    });
  }

  if (almostPage1.length > 0) {
    console.log('\n🟡 ALMOST PAGE 1 (positions 10-20, worth pushing):');
    almostPage1.slice(0, 5).forEach(o => {
      console.log(`  ${o.path}`);
      console.log(`    Pos: ${o.gsc.position} | Imp: ${o.gsc.impressions} | ${o.recommendation}`);
      if (o.queries?.length) {
        console.log(`    Queries: ${o.queries.map(q => '"' + q.query + '"').join(', ')}`);
      }
    });
  }

  if (contentOpps.length > 0) {
    console.log('\n🟢 CONTENT OPPORTUNITIES (high impressions, needs work):');
    contentOpps.slice(0, 5).forEach(o => {
      console.log(`  ${o.path}`);
      console.log(`    Pos: ${o.gsc.position} | Imp: ${o.gsc.impressions} | ${o.recommendation}`);
    });
  }

  if (highBounce.length > 0) {
    console.log('\n⚠️  HIGH BOUNCE (content doesn\'t match intent):');
    highBounce.slice(0, 5).forEach(o => {
      console.log(`  ${o.path}`);
      console.log(`    Bounce: ${o.ga?.bounceRate}% | Pos: ${o.gsc.position} | ${o.recommendation}`);
    });
  }

  console.log('\n' + '═'.repeat(70));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
