/**
 * scripts/ga/sync-profile-analytics.js
 *
 * Pulls GA4 pageview data per counselor profile and syncs it to Supabase
 * so the professional dashboard can show "Your profile got X views from Google this month."
 *
 * Writes to `profile_analytics` table in Supabase.
 * Run daily via GitHub Actions cron.
 *
 * Usage: node scripts/ga/sync-profile-analytics.js
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const GA_PROPERTY_ID = '501043083';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

const supabase = createClient(
  'https://bkjwctlolhoxhnoospwp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function gaReport(body) {
  const res = await analyticsData.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: body,
  });
  return res.data;
}

async function main() {
  console.log('Syncing GA4 profile analytics to Supabase...\n');

  // ── Ensure table exists ──
  // We'll upsert into profile_analytics. If the table doesn't exist,
  // the script will fail gracefully and tell you the SQL to run.

  // ── Pull all profile page views from GA4 (last 30 days) ──
  const report = await gaReport({
    dateRanges: [
      { startDate: '7daysAgo', endDate: 'today', name: 'last7d' },
      { startDate: '30daysAgo', endDate: 'today', name: 'last30d' },
    ],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'totalUsers' },
      { name: 'averageSessionDuration' },
    ],
    dimensionFilter: {
      orGroup: {
        expressions: [
          { filter: { fieldName: 'pagePath', stringFilter: { value: '/profile/', matchType: 'CONTAINS' } } },
          { filter: { fieldName: 'pagePath', stringFilter: { value: '/premarital-counseling/', matchType: 'BEGINS_WITH' } } },
        ],
      },
    },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 500,
  });

  // GA4 returns interleaved rows for multiple date ranges
  // Process rows: each row has dimensionValues and metricValues
  // With 2 date ranges, we get pairs of rows for the same dimension
  const pathStats = {};

  if (report.rows) {
    report.rows.forEach(row => {
      const path = row.dimensionValues[0].value;
      const dateRange = row.dimensionValues.length > 1 ? row.dimensionValues[1]?.value : null;

      if (!pathStats[path]) {
        pathStats[path] = { views_7d: 0, views_30d: 0, users_7d: 0, users_30d: 0, avg_duration: 0 };
      }

      // Determine which date range this row belongs to based on position
      // GA4 returns all rows for first range, then all for second
    });
  }

  // Simpler approach: run two separate queries
  const report7d = await gaReport({
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'totalUsers' },
      { name: 'averageSessionDuration' },
    ],
    dimensionFilter: {
      orGroup: {
        expressions: [
          { filter: { fieldName: 'pagePath', stringFilter: { value: '/profile/', matchType: 'CONTAINS' } } },
          { filter: { fieldName: 'pagePath', stringFilter: { value: '/premarital-counseling/', matchType: 'BEGINS_WITH' } } },
        ],
      },
    },
    limit: 500,
  });

  const report30d = await gaReport({
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'totalUsers' },
      { name: 'averageSessionDuration' },
    ],
    dimensionFilter: {
      orGroup: {
        expressions: [
          { filter: { fieldName: 'pagePath', stringFilter: { value: '/profile/', matchType: 'CONTAINS' } } },
          { filter: { fieldName: 'pagePath', stringFilter: { value: '/premarital-counseling/', matchType: 'BEGINS_WITH' } } },
        ],
      },
    },
    limit: 500,
  });

  // Build stats per path
  const allPaths = {};

  (report7d.rows || []).forEach(row => {
    const path = row.dimensionValues[0].value;
    if (!allPaths[path]) allPaths[path] = {};
    allPaths[path].views_7d = parseInt(row.metricValues[0].value);
    allPaths[path].users_7d = parseInt(row.metricValues[1].value);
  });

  (report30d.rows || []).forEach(row => {
    const path = row.dimensionValues[0].value;
    if (!allPaths[path]) allPaths[path] = {};
    allPaths[path].views_30d = parseInt(row.metricValues[0].value);
    allPaths[path].users_30d = parseInt(row.metricValues[1].value);
    allPaths[path].avg_duration = Math.round(parseFloat(row.metricValues[2].value));
  });

  // ── Match paths to profile IDs ──
  // Profile pages come in two URL patterns:
  //   /profile/{uuid}
  //   /premarital-counseling/{state}/{city}/{slug}

  // Get all profiles from Supabase
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, slug, city, state_province')
    .eq('is_hidden', false);

  if (profilesError) {
    console.error('Failed to load profiles:', profilesError.message);
    return;
  }

  // Build lookup maps
  const slugToProfileId = {};
  const uuidToProfileId = {};

  profiles.forEach(p => {
    uuidToProfileId[p.id] = p.id;
    if (p.slug) {
      slugToProfileId[p.slug] = p.id;
    }
  });

  // Match GA paths to profile IDs
  const profileAnalytics = {};

  Object.entries(allPaths).forEach(([path, stats]) => {
    let profileId = null;

    // Pattern 1: /profile/{uuid}
    const uuidMatch = path.match(/^\/profile\/([0-9a-f-]{36})$/);
    if (uuidMatch && uuidToProfileId[uuidMatch[1]]) {
      profileId = uuidMatch[1];
    }

    // Pattern 2: /premarital-counseling/{state}/{city}/{slug}
    if (!profileId) {
      const slugMatch = path.match(/^\/premarital-counseling\/[^/]+\/[^/]+\/([^/]+)$/);
      if (slugMatch) {
        const slug = slugMatch[1];
        if (slugToProfileId[slug]) {
          profileId = slugToProfileId[slug];
        }
      }
    }

    if (profileId) {
      // Merge if profile has multiple URL patterns
      if (!profileAnalytics[profileId]) {
        profileAnalytics[profileId] = {
          views_7d: 0, views_30d: 0, users_7d: 0, users_30d: 0, avg_duration: 0
        };
      }
      profileAnalytics[profileId].views_7d += stats.views_7d || 0;
      profileAnalytics[profileId].views_30d += stats.views_30d || 0;
      profileAnalytics[profileId].users_7d += stats.users_7d || 0;
      profileAnalytics[profileId].users_30d += stats.users_30d || 0;
      profileAnalytics[profileId].avg_duration = stats.avg_duration || profileAnalytics[profileId].avg_duration;
    }
  });

  console.log(`Matched ${Object.keys(profileAnalytics).length} profiles with GA4 data.\n`);

  // ── Upsert to Supabase ──
  const rows = Object.entries(profileAnalytics).map(([profileId, stats]) => ({
    profile_id: profileId,
    ga_views_7d: stats.views_7d,
    ga_views_30d: stats.views_30d,
    ga_users_7d: stats.users_7d,
    ga_users_30d: stats.users_30d,
    ga_avg_duration: stats.avg_duration,
    synced_at: new Date().toISOString(),
  }));

  if (rows.length === 0) {
    console.log('No profile analytics to sync.');
    return;
  }

  const { error: upsertError } = await supabase
    .from('profile_analytics')
    .upsert(rows, { onConflict: 'profile_id' });

  if (upsertError) {
    if (upsertError.message?.includes('relation "profile_analytics" does not exist')) {
      console.error('\n╔══════════════════════════════════════════════════════════╗');
      console.error('║  Table "profile_analytics" does not exist.              ║');
      console.error('║  Run this SQL in Supabase:                              ║');
      console.error('╚══════════════════════════════════════════════════════════╝\n');
      console.log(`CREATE TABLE profile_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ga_views_7d INTEGER DEFAULT 0,
  ga_views_30d INTEGER DEFAULT 0,
  ga_users_7d INTEGER DEFAULT 0,
  ga_users_30d INTEGER DEFAULT 0,
  ga_avg_duration INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id)
);

-- RLS: Let profile owners see their own analytics
ALTER TABLE profile_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own analytics"
  ON profile_analytics FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));
`);
      return;
    }
    console.error('Upsert error:', upsertError.message);
    return;
  }

  console.log(`Synced ${rows.length} profile analytics records.\n`);

  // Print top profiles by views
  const sorted = rows.sort((a, b) => b.ga_views_30d - a.ga_views_30d);
  console.log('Top 10 profiles by GA4 views (30 days):');
  sorted.slice(0, 10).forEach((r, i) => {
    const profile = profiles.find(p => p.id === r.profile_id);
    const name = profile?.slug || r.profile_id.substring(0, 8);
    console.log(`  ${i + 1}. ${name}: ${r.ga_views_30d} views (${r.ga_users_30d} users), ${r.ga_views_7d} views last 7d`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
