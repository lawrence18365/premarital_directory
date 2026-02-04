
require('dotenv').config({ path: 'client/.env' });
require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

if (!SUPABASE_URL || (!SUPABASE_ANON_KEY && !INTERNAL_API_KEY)) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-state-content`;

async function testStateGeneration() {
    console.log('🧪 Testing generate-state-content function...');
    console.log(`URL: ${FUNCTION_URL}`);

    const payload = {
        state: 'texas',
        stateName: 'Texas',
        stateAbbr: 'TX',
        majorCities: ['Austin', 'Dallas', 'Houston'],
        population: '29000000',
        characteristics: ['Large state', 'Diverse population']
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

    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

testStateGeneration();
