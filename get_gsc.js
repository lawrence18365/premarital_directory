const { google } = require('googleapis');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: 'client/.env.local' });

async function getGscData() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  
  const customsearch = google.webmasters({ version: 'v3', auth: oAuth2Client });
  
  const res = await customsearch.searchanalytics.query({
    siteUrl: 'sc-domain:weddingcounselors.com',
    requestBody: {
      startDate: '2025-11-20',
      endDate: '2026-02-21',
      dimensions: ['query'],
      rowLimit: 20
    }
  });
  
  console.log('--- Top performing queries ---');
  res.data.rows.forEach(row => {
    console.log(`Query: ${row.keys[0].padEnd(35)} | Clicks: ${row.clicks.toString().padStart(3)} | Imp: ${row.impressions.toString().padStart(4)} | CTR: ${(row.ctr * 100).toFixed(2)}% | Pos: ${row.position.toFixed(1)}`);
  });
  
  const pageRes = await customsearch.searchanalytics.query({
    siteUrl: 'sc-domain:weddingcounselors.com',
    requestBody: {
      startDate: '2025-11-20',
      endDate: '2026-02-21',
      dimensions: ['page'],
      rowLimit: 15
    }
  });
  
  console.log('\n--- Top performing pages ---');
  pageRes.data.rows.forEach(row => {
    console.log(`Page: ${row.keys[0].split('.com')[1].padEnd(50)} | Clicks: ${row.clicks.toString().padStart(3)} | Imp: ${row.impressions.toString().padStart(4)}`);
  });
}
getGscData();
