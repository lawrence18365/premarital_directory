/**
 * One-time script to run pending SQL migrations via Supabase Management API.
 * Uses the service role key to execute SQL.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://bkjwctlolhoxhnoospwp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable(name) {
  const { error } = await supabase.from(name).select('id').limit(1);
  if (error && error.message.includes('does not exist')) return false;
  if (error && error.code === '42P01') return false;
  return true;
}

async function runMigration(name, sql) {
  console.log(`\n--- ${name} ---`);

  // Try using the Supabase SQL endpoint via fetch
  const url = 'https://bkjwctlolhoxhnoospwp.supabase.co/rest/v1/rpc/';

  // Supabase doesn't expose raw SQL via REST. We'll create tables using
  // the supabase-js client's rpc or use the management API.
  // Since we can't run raw SQL, let's try the management API.

  const mgmtUrl = `https://api.supabase.com/v1/projects/bkjwctlolhoxhnoospwp/database/query`;

  const response = await fetch(mgmtUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const status = response.status;
  const text = await response.text();

  if (status === 201 || status === 200) {
    console.log(`  OK (${status})`);
    return true;
  } else {
    console.log(`  Status: ${status}`);
    console.log(`  Response: ${text.substring(0, 200)}`);
    return false;
  }
}

async function main() {
  console.log('=== Running Migrations ===');

  // Check which tables exist
  const hasIndexing = await checkTable('indexing_submissions');
  const hasAnalytics = await checkTable('profile_analytics');

  console.log('indexing_submissions exists:', hasIndexing);
  console.log('profile_analytics exists:', hasAnalytics);

  if (hasIndexing && hasAnalytics) {
    console.log('\nBoth tables already exist. Nothing to do.');
    return;
  }

  // Read migration SQL files
  const fs = require('fs');
  const path = require('path');

  if (!hasIndexing) {
    const sql = fs.readFileSync(
      path.join(__dirname, '..', '..', 'supabase', 'migrations', '20260226_indexing_submissions.sql'),
      'utf-8'
    );
    await runMigration('indexing_submissions', sql);
  }

  if (!hasAnalytics) {
    const sql = fs.readFileSync(
      path.join(__dirname, '..', '..', 'supabase', 'migrations', '20260226_profile_analytics.sql'),
      'utf-8'
    );
    await runMigration('profile_analytics', sql);
  }

  // Verify
  console.log('\n=== Verification ===');
  console.log('indexing_submissions:', await checkTable('indexing_submissions') ? 'EXISTS' : 'MISSING');
  console.log('profile_analytics:', await checkTable('profile_analytics') ? 'EXISTS' : 'MISSING');
}

main().catch(e => { console.error(e); process.exit(1); });
