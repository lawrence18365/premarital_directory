const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const dotenv = require('dotenv')

// Load env vars from root or client
const rootEnv = dotenv.config({ path: path.join(__dirname, '..', '.env') })
const clientEnv = dotenv.config({ path: path.join(__dirname, '..', 'client', '.env') })

// Try to find credentials in any loaded config
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials.')
  console.error('Please ensure you have a .env file in the root or client/ directory with:')
  console.error('REACT_APP_SUPABASE_URL=...')
  console.error('REACT_APP_SUPABASE_ANON_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cities to warm up (High priority anchors)
const TARGET_CITIES = [
  { state: 'texas', city: 'Austin' },
  { state: 'texas', city: 'Dallas' },
  { state: 'texas', city: 'Houston' },
  { state: 'california', city: 'Los Angeles' },
  { state: 'california', city: 'San Francisco' },
  { state: 'new-york', city: 'New York' },
  { state: 'florida', city: 'Miami' },
  { state: 'illinois', city: 'Chicago' },
  { state: 'georgia', city: 'Atlanta' },
  { state: 'colorado', city: 'Denver' }
]

async function warmup() {
  console.log('🔥 Starting SEO Cache Warmup...')
  
  for (const { state, city } of TARGET_CITIES) {
    console.log(`⏳ Generating content for ${city}, ${state}...`)
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-city-content', {
        body: { state, city }
      })

      if (error) {
        console.error(`❌ Error for ${city}:`, error.message)
      } else {
        console.log(`✅ Success for ${city}! Title: ${data.title}`)
      }
    } catch (err) {
      console.error(`❌ Failed to reach Edge Function for ${city}:`, err.message)
    }
    
    // Small delay to be kind to the free-tier API
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('🏁 Warmup complete!')
}

warmup()
