const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = 'https://bkjwctlolhoxhnoospwp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBadges() {
    console.log("Checking badge submissions...");
    const { data: submissions, error: subError } = await supabase
        .from('badge_submissions')
        .select('*');

    if (subError) {
        console.error("Error fetching submissions:", subError);
    } else {
        console.log(`Total badge submissions: ${submissions.length}`);
        console.log(submissions);
    }

    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, badge_verified, is_verified, slug')
        .eq('badge_verified', true);

    if (profError) {
        console.error("Error fetching profiles:", profError);
    } else {
        console.log(`\nProfiles with badge_verified=true: ${profiles.length}`);
        if (profiles.length > 0) {
            console.log(profiles);
        }
    }

    console.log("Checking profile clicks for badge page...");
    // Let's also see if the professional dashboard is getting clicked
    // Wait, no easy way without tracking. Let me find how many active profiles there are.
    const { data: activeProfiles, error: error5 } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_claimed', true);
    console.log(`Total Claimed Profiles: ${activeProfiles?.length}`);
}

checkBadges();
