const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const connectionString = "postgresql://postgres:1relands@db.bkjwctlolhoxhnoospwp.supabase.co:5432/postgres";
    const client = new Client({ connectionString });

    try {
        await client.connect();
        const sql = fs.readFileSync('supabase/migrations/20260222120000_force_drop_broken_users_policy.sql', 'utf8');
        console.log("Executing SQL...");
        await client.query(sql);
        console.log("SQL execution successful! Policy dropped and recreated.");
    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await client.end();
    }
}
run();
