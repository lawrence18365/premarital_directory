const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: 'client/.env.local' });
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function getCleanClicks() {
  const { data: allClicks, error } = await supabase.from('profile_clicks').select('created_at, user_agent, source_page');
  if (error) {
    console.log('Error:', error);
    return;
  }
  
  let botVSHuman = { bot: 0, human: 0 };
  let humanAgents = {};
  
  allClicks.forEach(click => {
    const ua = (click.user_agent || '').toLowerCase();
    const isBot = ua.includes('bot') || ua.includes('crawl') || ua.includes('spider') || ua.includes('headless');
    
    if (isBot) {
      botVSHuman.bot++;
    } else {
      botVSHuman.human++;
      let browser = 'Other';
      if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
      else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
      else if (ua.includes('firefox')) browser = 'Firefox';
      else if (ua.includes('edg')) browser = 'Edge';
      
      humanAgents[browser] = (humanAgents[browser] || 0) + 1;
    }
  });
  
  console.log('--- True Traffic Breakdown ---');
  console.log('Total Clicks Logged:', allClicks.length);
  console.log('Bot Clicks:', botVSHuman.bot);
  console.log('Human/Browser Clicks:', botVSHuman.human);
  console.log('Browser types:', humanAgents);
}
getCleanClicks();
