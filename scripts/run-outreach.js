const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: 'client/.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runOutreach() {
    console.log('🚀 Starting Pre-Marital Counseling Outreach Campaign...');

    // Check how many we've sent today
    const { data: todayStats } = await supabase.from('outreach_today').select('*').single();
    const dailyLimit = todayStats?.daily_limit || 25;
    const sentToday = todayStats?.emails_sent_today || 0;

    if (sentToday >= dailyLimit) {
        console.log(`\n🛑 Daily limit reached (${sentToday}/${dailyLimit}). Exiting.`);
        process.exit(0);
    }

    const batchSize = Math.min(dailyLimit - sentToday, 50); // Get up to the remaining limit
    console.log(`\n📊 Status: Sent ${sentToday}/${dailyLimit} today. Running batch of up to ${batchSize}...`);

    // Fetch uncontacted, unclaimed profiles with valid emails
    const { data: prospects, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, email, claim_token')
        .eq('is_claimed', false)
        .is('contacted_at', null)
        .not('email', 'is', null)
        .not('claim_token', 'is', null)
        .limit(batchSize);

    if (fetchError) {
        console.error("❌ Error fetching prospects:", fetchError);
        process.exit(1);
    }

    if (!prospects || prospects.length === 0) {
        console.log("✅ No remaining uncontacted prospects found in the database. Campaign complete!");
        process.exit(0);
    }

    console.log(`Found ${prospects.length} ready prospects. Initiating Edge Function triggers...`);

    let successCount = 0;
    let failCount = 0;

    for (const profile of prospects) {
        console.log(`\n> Contacting: ${profile.full_name} (${profile.email})`);

        const payload = {
            provider_email: profile.email,
            provider_name: profile.full_name,
            profile_id: profile.id,
            claim_token: profile.claim_token,
            template: 'initial_outreach'
        };

        try {
            const { data, error } = await supabase.functions.invoke('send-outreach-email', {
                body: payload,
                headers: { 'x-temp-bypass': 'execute-outreach-now' }
            });

            if (error) {
                console.error(`  ❌ Failed (Function Error):`, error.message);
                failCount++;
                continue;
            }

            if (!data?.success) {
                console.error(`  ⚠️ Skipped/Failed (API Reason):`, data?.error || data?.reason);
                failCount++;

                // If it was skipped due to DNC, we should mark it contacted so it doesn't get retried infinitely
                if (data?.reason === 'do_not_contact') {
                    await supabase.from('profiles').update({ contacted_at: new Date().toISOString() }).eq('id', profile.id);
                }
                continue;
            }

            // Mark as contacted successfully
            await supabase.from('profiles').update({ contacted_at: new Date().toISOString() }).eq('id', profile.id);
            console.log(`  ✅ Success: Email queued/sent via Resend.`);
            successCount++;

            // Wait 1 second between emails to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (err) {
            console.error(`  ❌ Critical Error:`, err.message);
            failCount++;
        }
    }

    console.log('\n======================================================');
    console.log(`🏁 OUTREACH RUN COMPLETE`);
    console.log(`- Successfully Contacted: ${successCount}`);
    console.log(`- Failed/Skipped: ${failCount}`);
    console.log('======================================================');
}

runOutreach();
