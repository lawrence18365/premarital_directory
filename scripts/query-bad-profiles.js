import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://bkjwctlolhoxhnoospwp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, email, full_name, slug, city, state_province, is_claimed, moderation_status, created_at, onboarding_completed')
    .not('user_id', 'is', null)
    .or('full_name.is.null,city.is.null,state_province.is.null,full_name.eq."",city.eq."",state_province.eq.""');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log("Found bad profiles:", data?.length);
  console.log(JSON.stringify(data, null, 2));
}

main();
