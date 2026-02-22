const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log("=== Fixing Dr. Ryan's Profile ===");

    // Fetch William Joseph Ryan's profile
    const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%William Joseph Ryan%')
        .single();

    if (pErr || !profile) {
        console.error("Could not find Dr. Ryan's profile", pErr);
        return;
    }

    console.log(`Found Profile: ${profile.full_name}, ID: ${profile.id}, Status: ${profile.moderation_status}, UserID: ${profile.user_id}`);

    if (profile.user_id) {
        console.log("Updating `moderation_status` to 'approved' and `is_claimed` to true...");
        const { data: updated, error: uErr } = await supabase
            .from('profiles')
            .update({
                moderation_status: 'approved',
                is_claimed: true,
            })
            .eq('id', profile.id)
            .select();

        if (uErr) {
            console.error("Failed to update:", uErr);
        } else {
            console.log("Successfully fixed Dr. Ryan's profile! New state:", updated[0].moderation_status);
        }
    } else {
        console.log("Wait, he doesn't have a user_id!?");
    }
}
main().catch(console.error);
