const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function main() {
  const [profiles, logs] = await Promise.all([
    s.from('profiles').select('id, full_name, email, created_at, claimed_at, is_claimed, badge_verified').eq('is_hidden', false).eq('is_claimed', true),
    s.from('drip_email_log').select('profile_id, step'),
  ]);

  const logsByProfile = {};
  (logs.data || []).forEach(l => {
    if (logsByProfile[l.profile_id] === undefined) logsByProfile[l.profile_id] = new Set();
    logsByProfile[l.profile_id].add(Number(l.step));
  });

  const now = new Date();
  let missedStep3 = 0;

  console.log('Claimed counselors and their drip status:');
  console.log('');

  const sorted = (profiles.data || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  sorted.forEach(p => {
    const ref = new Date(p.claimed_at || p.created_at);
    const days = Math.floor((now - ref) / (1000 * 60 * 60 * 24));
    const steps = logsByProfile[p.id] || new Set();
    const stepsStr = [1, 2, 3, 4].map(step => steps.has(step) ? step : '-').join(',');
    const missed = days > 28 && !steps.has(4) ? ' ** MISSED BADGE EMAIL' : '';
    if (missed) missedStep3++;

    console.log(
      (p.full_name || '').padEnd(35) +
      ' | ' + String(days).padStart(3) + 'd ago' +
      ' | steps: [' + stepsStr + ']' +
      ' | badge: ' + (p.badge_verified ? 'YES' : 'no') +
      missed
    );
  });

  console.log('');
  console.log('Total claimed: ' + sorted.length);
  console.log('Missed badge email (step 3): ' + missedStep3);
  console.log('Badge verified: ' + sorted.filter(p => p.badge_verified).length);
}

main().catch(console.error);
