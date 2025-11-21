/**
 * Bulk AI Content Generation Script
 * Generates unique, SEO-rich content for pages flagged as Soft 404
 *
 * This script will:
 * 1. Identify pages with thin/missing content
 * 2. Generate AI-powered unique content for each
 * 3. Cache content in database
 * 4. Prevent Soft 404 errors by adding substantial content
 *
 * Usage: node bulk_generate_content.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const openRouterKey = process.env.REACT_APP_OPENROUTER_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!openRouterKey) {
  console.error('❌ Missing OpenRouter API key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// State configuration (simplified)
const STATE_CONFIG = {
  "georgia": { "name": "Georgia", "abbr": "GA", "major_cities": ["atlanta", "augusta", "columbus", "savannah"] },
  "indiana": { "name": "Indiana", "abbr": "IN", "major_cities": ["indianapolis", "fort-wayne", "evansville"] },
  "kentucky": { "name": "Kentucky", "abbr": "KY", "major_cities": ["louisville", "lexington", "bowling-green"] },
  "new-york": { "name": "New York", "abbr": "NY", "major_cities": ["new-york-city", "buffalo", "rochester", "yonkers", "syracuse"] },
  "new-mexico": { "name": "New Mexico", "abbr": "NM", "major_cities": ["albuquerque", "las-cruces", "rio-rancho"] },
  "arkansas": { "name": "Arkansas", "abbr": "AR", "major_cities": ["little-rock", "fort-smith", "fayetteville"] },
  "hawaii": { "name": "Hawaii", "abbr": "HI", "major_cities": ["honolulu", "hilo", "kailua"] },
  "massachusetts": { "name": "Massachusetts", "abbr": "MA", "major_cities": ["boston", "worcester", "springfield", "cambridge"] },
  "iowa": { "name": "Iowa", "abbr": "IA", "major_cities": ["des-moines", "cedar-rapids", "davenport"] },
  "washington": { "name": "Washington", "abbr": "WA", "major_cities": ["seattle", "spokane", "tacoma", "vancouver"] },
  "north-dakota": { "name": "North Dakota", "abbr": "ND", "major_cities": ["fargo", "bismarck", "grand-forks"] },
  "nebraska": { "name": "Nebraska", "abbr": "NE", "major_cities": ["omaha", "lincoln", "bellevue"] },
  "missouri": { "name": "Missouri", "abbr": "MO", "major_cities": ["kansas-city", "st-louis", "springfield", "columbia"] },
  "arizona": { "name": "Arizona", "abbr": "AZ", "major_cities": ["phoenix", "tucson", "mesa", "chandler", "scottsdale"] },
  "illinois": { "name": "Illinois", "abbr": "IL", "major_cities": ["chicago", "aurora", "naperville", "joliet"] },
  "california": { "name": "California", "abbr": "CA", "major_cities": ["los-angeles", "san-diego", "san-jose", "san-francisco"] },
  "delaware": { "name": "Delaware", "abbr": "DE", "major_cities": ["wilmington", "dover", "newark"] },
  "west-virginia": { "name": "West Virginia", "abbr": "WV", "major_cities": ["charleston", "huntington", "morgantown"] },
  "south-dakota": { "name": "South Dakota", "abbr": "SD", "major_cities": ["sioux-falls", "rapid-city", "aberdeen"] },
  "oklahoma": { "name": "Oklahoma", "abbr": "OK", "major_cities": ["oklahoma-city", "tulsa", "norman"] }
};

async function generateContentForCity(stateSlug, citySlug, stateName, cityName, stateAbbr) {
  console.log(`\n🔄 Generating content for ${cityName}, ${stateAbbr}...`);

  // Check if content already exists
  const { data: existing } = await supabase
    .from('city_content_cache')
    .select('id')
    .eq('state', stateSlug)
    .eq('city', citySlug)
    .single();

  if (existing) {
    console.log(`  ℹ️  Content already exists, skipping`);
    return { skipped: true };
  }

  // Generate AI content using OpenRouter
  const prompt = `Generate SEO-optimized content for a premarital counseling directory page for ${cityName}, ${stateName}.

Create unique, helpful content that:
1. Discusses premarital counseling options in ${cityName}
2. Mentions local context (without making up specific businesses)
3. Covers pricing ranges ($100-200/session typical)
4. Explains benefits of local vs online counseling
5. Discusses faith-based and secular options

Format as JSON with:
{
  "title": "SEO title (60 chars max)",
  "description": "Meta description (150 chars max)",
  "h1_content": "H1 headline",
  "intro_paragraph": "2-3 sentence intro (200+ words)",
  "marriage_statistics": {"stat": "value"},
  "pricing_insights": {"range": "description"},
  "local_venues": ["venue types in the area"],
  "demographics": {"population": "approx", "median_age": "range"}
}

Be factual, helpful, and avoid fluff. Make it unique to ${cityName}.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://weddingcounselors.com',
        'X-Title': 'Wedding Counselors'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    // Store in database
    const { error: insertError } = await supabase
      .from('city_content_cache')
      .insert({
        state: stateSlug,
        city: citySlug,
        state_abbr: stateAbbr,
        title: content.title,
        description: content.description,
        h1_content: content.h1_content,
        intro_paragraph: content.intro_paragraph,
        marriage_statistics: content.marriage_statistics || {},
        pricing_insights: content.pricing_insights || {},
        local_venues: content.local_venues || [],
        demographics: content.demographics || {},
        generation_cost_tokens: data.usage?.total_tokens || 0,
        api_provider: 'openrouter',
        cache_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

    if (insertError) {
      throw insertError;
    }

    console.log(`  ✅ Generated and cached (${data.usage?.total_tokens || 0} tokens)`);
    return { generated: true, tokens: data.usage?.total_tokens || 0 };

  } catch (error) {
    console.error(`  ❌ Error generating content:`, error.message);
    return { error: true };
  }
}

async function main() {
  console.log('🚀 Starting bulk content generation for Soft 404 pages...\n');

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalTokens = 0;

  // Process each state from the Soft 404 report
  for (const [stateSlug, stateConfig] of Object.entries(STATE_CONFIG)) {
    console.log(`\n📍 Processing ${stateConfig.name}...`);

    for (const citySlug of stateConfig.major_cities) {
      const cityName = citySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const result = await generateContentForCity(
        stateSlug,
        citySlug,
        stateConfig.name,
        cityName,
        stateConfig.abbr
      );

      if (result.generated) {
        totalGenerated++;
        totalTokens += result.tokens || 0;
      } else if (result.skipped) {
        totalSkipped++;
      } else if (result.error) {
        totalErrors++;
      }

      // Rate limiting - wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`✅ Generated: ${totalGenerated}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log(`📊 Total tokens: ${totalTokens}`);
  console.log(`💰 Estimated cost: $${(totalTokens * 0.00001).toFixed(4)}`);
}

main().catch(console.error);
