const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://bkjwctlolhoxhnoospwp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log("=== Debugging User Profiles and Claims ===\n");

    const names = ['Alicia', 'Deborah', 'Ryan'];

    for (const name of names) {
        console.log(`\n--- Searching for: ${name} ---`);

        // Find Profiles
        const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('id, full_name, email, user_id, slug, moderation_status')
            .ilike('full_name', `%${name}%`);

        if (pErr) {
            console.error("Error fetching profiles:", pErr);
        } else {
            console.log(`Profiles found (${profiles.length}):`);
            for (const p of profiles) {
                console.log(`  - ID: ${p.id}, Name: ${p.full_name}, Email: ${p.email}, user_id: ${p.user_id}, Status: ${p.moderation_status}`);
                const { data: claims, error: cErr } = await supabase
                    .from('profile_claims')
                    .select('*')
                    .eq('profile_id', p.id);
                if (claims && claims.length > 0) {
                    console.log(`    Claims for ${p.full_name}:`);
                    claims.forEach(c => console.log(`      - Claim ID: ${c.id}, Status: ${c.status}, User: ${c.user_id}, Email: ${c.contact_email}`));
                } else {
                    console.log(`    No claims found for ${p.full_name}`);
                }
            }
        }

        // Find Claims by name directly (if they submitted a claim but profile doesn't match perfectly)
        const { data: strClaims, error: strErr } = await supabase
            .from('profile_claims')
            .select('*')
            .ilike('contact_email', `%${name}%`);

        if (strClaims && strClaims.length > 0) {
            console.log(`\n    [Unlinked] Claims searching by email for ${name}:`);
            strClaims.forEach(c => console.log(`      - Claim ID: ${c.id}, Status: ${c.status}, User: ${c.user_id}, Email: ${c.contact_email}`));
        }
    }
}

main().catch(console.error);
