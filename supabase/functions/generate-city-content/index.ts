import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CityContentRequest {
  state: string
  city: string
  stateAbbr: string
  demographicData?: any
  venueData?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { state, city, stateAbbr }: CityContentRequest = await req.json()
    
    if (!state || !city || !stateAbbr) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: state, city, stateAbbr' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch demographic data server-side to avoid CORS issues
    const demographicData = await fetchCensusData(city, stateAbbr)
    const venueData = await fetchVenueData(city, state)
    
    // Fetch real-time web research for SEO domination
    const webResearch = await fetchCityWebResearch(city, state)

    // Get OpenRouter API key from environment
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured')
    }

    // Build the prompt with web research
    const prompt = buildPrompt(city, state, stateAbbr, demographicData, venueData, webResearch)
    
    console.log(`Generating content for ${city}, ${state}`)

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-domain.com',
        'X-Title': 'Premarital Counseling Directory'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528:free',
        messages: [
          {
            role: 'system',
            content: 'You are a professional content writer specializing in local business directories and SEO content. Always return valid JSON.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`OpenRouter error: ${data.error.message}`)
    }

    // Parse and validate the response
    const content = JSON.parse(data.choices[0].message.content)
    
    // Validate required fields
    const required = ['description', 'h1', 'intro', 'marriageStats', 'venues', 'pricing']
    for (const field of required) {
      if (!content[field]) {
        console.warn(`Missing field: ${field}`)
      }
    }

    // Return the generated content
    const result = {
      title: `Premarital Counseling in ${city}, ${state}`,
      description: content.description,
      h1_content: content.h1,
      intro_paragraph: content.intro,
      marriage_statistics: content.marriageStats,
      local_venues: content.venues,
      pricing_insights: content.pricing,
      legal_requirements: content.legalRequirements,
      nearby_cities: content.nearbyCities,
      demographics: content.demographics,
      generation_cost_tokens: data.usage?.total_tokens || 0,
      api_provider: 'openrouter-deepseek-r1-free'
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating city content:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: true
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function buildPrompt(city: string, state: string, stateAbbr: string, demographicData: any, venueData: any, webResearch: any) {
  return `Generate comprehensive, SEO-optimized content for a premarital counseling directory page for ${city}, ${state}.

DEMOGRAPHIC DATA: ${JSON.stringify(demographicData || {})}
VENUE DATA: ${JSON.stringify(venueData || {})}
WEB RESEARCH DATA: ${JSON.stringify(webResearch || {})}

Create content that includes:

1. META DESCRIPTION (150 chars): SEO-friendly description
2. H1 HEADING: Compelling main heading
3. INTRO PARAGRAPH (200 words): Engaging introduction about premarital counseling in this city
4. MARRIAGE STATISTICS: Local marriage trends, average age, divorce rates
5. LOCAL VENUES: General venue types (NOT specific venue names)
6. PRICING INSIGHTS: Estimated session costs in this area (use ranges, be conservative)
7. LEGAL REQUIREMENTS: General guidance (NOT specific legal requirements)
8. NEARBY CITIES: 3-5 related cities for "also serving" SEO
9. DEMOGRAPHICS: Local population insights relevant to couples

OUTPUT FORMAT: Valid JSON only with these keys:
{
  "description": "meta description",
  "h1": "main heading",
  "intro": "intro paragraph",
  "marriageStats": {"avgAge": 28, "annualMarriages": 1200, "trends": "..."},
  "venues": [{"name": "Venue Type", "type": "type", "description": "..."}],
  "pricing": {"sessionCost": "$150-250", "packageDeals": "...", "insurance": "..."},
  "legalRequirements": "general guidance...",
  "nearbyCities": ["City1", "City2", "City3"],
  "demographics": {"population": 50000, "medianAge": 35, "married": "52%"}
}

CRITICAL SAFETY INSTRUCTIONS (to avoid hallucinations):
- For LEGAL REQUIREMENTS: Use safe, general language like "Marriage laws vary by county and state. Contact your local clerk's office or government website for current marriage license requirements, waiting periods, and necessary documentation."
- For VENUES: Do NOT invent specific venue names. Instead, use generic descriptions like "Many couples in ${city} choose local churches, hotel ballrooms, event centers, or outdoor venues. Your premarital counselor can often recommend trusted local options."
- For PRICING: Use conservative ranges based on national averages. Do NOT claim specific dollar amounts as facts. Use phrases like "typically ranges from" or "counselors in similar markets often charge"
- For STATISTICS: If unsure about specific numbers, use general phrases like "Similar to national trends" or "Comparable to other ${state} cities"
- NEVER claim specific legal requirements (e.g., "Texas requires...")
- NEVER invent specific venue or business names
- NEVER state pricing as definitive facts

IMPORTANT SEO INSTRUCTIONS:
- Focus on being helpful and accurate rather than overly specific
- Use location keywords naturally: premarital counseling ${city}, premarital counselling ${city} (UK spelling), pre-marital counseling ${city}
- Include "Christian premarital counseling ${city}" and "online premarital counseling" as keyword variations
- Emphasize the value of professional guidance for engaged couples

Make content unique, helpful, and safe from hallucinated facts. Focus on genuinely useful information for couples.`
}

// Fetch census data server-side
async function fetchCensusData(city: string, stateAbbr: string) {
  try {
    // Get Census API key from environment
    const CENSUS_API_KEY = Deno.env.get('CENSUS_API_KEY')
    
    // Simple city to county mapping for major cities
    const cityMappings: { [key: string]: { state: string, county: string } } = {
      'anchorage_AK': { state: '02', county: '020' },
      'fairbanks_AK': { state: '02', county: '090' },
      'juneau_AK': { state: '02', county: '110' },
      'sitka_AK': { state: '02', county: '220' },
      'birmingham_AL': { state: '01', county: '073' },
      'montgomery_AL': { state: '01', county: '101' },
      // Add more as needed
    }
    
    const geoKey = `${city.toLowerCase()}_${stateAbbr.toUpperCase()}`
    const geoData = cityMappings[geoKey]
    
    if (geoData && CENSUS_API_KEY) {
      const variables = ['B01003_001E', 'B19013_001E'] // Population, Median Income
      const url = `https://api.census.gov/data/2022/acs/acs1?get=${variables.join(',')}&for=county:${geoData.county}&in=state:${geoData.state}&key=${CENSUS_API_KEY}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data && data.length > 1) {
        return {
          population: parseInt(data[1][0]) || 50000,
          medianIncome: parseInt(data[1][1]) || 65000,
          source: 'US Census Bureau'
        }
      }
    }
    
    // Fallback data
    return {
      population: 50000,
      medianIncome: 65000,
      source: 'Estimated'
    }
  } catch (error) {
    console.error('Census fetch error:', error)
    return {
      population: 50000,
      medianIncome: 65000,
      source: 'Fallback'
    }
  }
}

// Fetch venue data (simplified)
async function fetchVenueData(city: string, state: string) {
  return [
    { name: `${city} Community Center`, type: 'venue', description: 'Popular local venue' },
    { name: `${city} Event Hall`, type: 'hall', description: 'Wedding and event space' },
    { name: `Historic ${city}`, type: 'historic', description: 'Historic district venue options' }
  ]
}

// Fetch real-time city web research using Jina AI
async function fetchCityWebResearch(city: string, state: string) {
  try {
    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
    
    if (!JINA_API_KEY) {
      console.log('Jina AI API key not found, using fallback research')
      return {
        trendingTopics: [{ topic: "Local Counseling Trends", insight: "Increasing demand for couples therapy" }],
        competitorAnalysis: [],
        pricingInsights: [{ source: "Local Average", info: `Premarital counseling in ${city} typically ranges $125-$200` }],
        source: 'fallback-data'
      }
    }

    // City-specific searches
    const searches = [
      `premarital counseling ${city} ${state} 2024 reviews pricing`,
      `best marriage therapists ${city} ${state}`,
      `couples therapy ${city} cost pricing 2024`,
      `${city} ${state} wedding venues premarital prep`
    ]

    const searchResults = []
    
    for (const query of searches) {
      try {
        const response = await fetch('https://s.jina.ai/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JINA_API_KEY}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            q: query, // Correct parameter name
            num: 3 // Correct parameter name
          })
        })

        if (response.ok) {
          const data = await response.json()
          searchResults.push({
            query: query,
            results: Array.isArray(data) ? data : (data.data || [])
          })
        }
        
        await new Promise(resolve => setTimeout(resolve, 300))
        
      } catch (error) {
        console.warn(`City search failed for: ${query}`, error)
      }
    }

    return {
      searchResults: searchResults,
      trendingTopics: extractCityTrends(searchResults),
      competitorAnalysis: extractCityCompetitors(searchResults),
      pricingInsights: extractCityPricing(searchResults),
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('City web research error:', error)
    return { source: 'fallback-data' }
  }
}

function extractCityTrends(searchResults: any[]) {
  const trends = []
  for (const search of searchResults) {
    for (const result of search.results || []) {
      if (result.title && result.content) {
        trends.push({
          topic: result.title,
          insight: result.content.substring(0, 200)
        })
      }
    }
  }
  return trends.slice(0, 2)
}

function extractCityCompetitors(searchResults: any[]) {
  const competitors = []
  for (const search of searchResults) {
    for (const result of search.results || []) {
      if (result.title && result.url) {
        competitors.push({
          title: result.title,
          url: result.url,
          snippet: result.content || result.snippet || ''
        })
      }
    }
  }
  return competitors.slice(0, 3)
}

function extractCityPricing(searchResults: any[]) {
  const pricing = []
  for (const search of searchResults) {
    if (search.query.includes('cost') || search.query.includes('pricing')) {
      for (const result of search.results || []) {
        if (result.content || result.snippet) {
          pricing.push({
            source: result.title,
            info: result.content || result.snippet
          })
        }
      }
    }
  }
  return pricing.slice(0, 2)
}