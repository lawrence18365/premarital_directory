
require('dotenv').config({ path: 'client/.env' });
require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

if (!SUPABASE_URL || (!SUPABASE_ANON_KEY && !INTERNAL_API_KEY)) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

if (SUPABASE_ANON_KEY) {
    console.log(`🔑 ANON_KEY loaded: ${SUPABASE_ANON_KEY.substring(0, 5)}...`);
}
if (INTERNAL_API_KEY) {
    console.log('🔐 INTERNAL_API_KEY loaded');
}

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-city-content`;

async function testCityGeneration() {
    console.log('🧪 Testing generate-city-content function for Austin, TX...');
    console.log(`URL: ${FUNCTION_URL}`);

    const payload = {
        city: 'Austin',
        state: 'Texas',
        stateAbbr: 'TX',
        demographicData: { population: 978908 },
        venueData: []
    };

    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(SUPABASE_ANON_KEY ? { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } : {}),
                ...(INTERNAL_API_KEY ? { 'x-internal-api-key': INTERNAL_API_KEY } : {})
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Function failed with status: ${response.status}`);
            console.error(`Error details: ${errorText}`);
            return;
        }

        const data = await response.json();
        console.log('✅ Function success!');
        console.log('Response preview:', JSON.stringify(data, null, 2).substring(0, 500) + '...');

        if (data.web_research_used) {
            console.log('🌐 Web research was successfully used!');
        } else {
            console.log('⚠️ Web research was NOT used (or flag not set).');
        }

    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

testCityGeneration();
