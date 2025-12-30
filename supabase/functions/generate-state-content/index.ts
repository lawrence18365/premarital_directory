import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StateContentRequest {
  state: string
  stateName: string
  stateAbbr: string
  majorCities: string[]
  population?: string
  characteristics?: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { state, stateName, stateAbbr, majorCities, population, characteristics }: StateContentRequest = await req.json()

    if (!state || !stateName || !stateAbbr || !majorCities) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: state, stateName, stateAbbr, majorCities' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch additional state data server-side
    const stateData = await fetchStateData(stateName, stateAbbr)

    // Fetch real-time web research for SEO domination
    const webResearch = await fetchWebResearch(stateName, stateAbbr, majorCities)

    // Get OpenRouter API key from environment
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured')
    }

    // Build the prompt for state content with web research
    const prompt = buildStatePrompt(stateName, stateAbbr, majorCities, stateData, webResearch, population, characteristics)

    console.log(`Feeding DeepSeek for ${stateName}:`)
    console.log(`   State data: ${JSON.stringify(stateData)}`)
    console.log(`   Web research: ${webResearch.searchResults?.length || 0} searches, ${webResearch.competitorAnalysis?.length || 0} competitors, ${webResearch.pricingInsights?.length || 0} pricing insights`)
    console.log(`Generating state content for ${stateName} with DeepSeek R1`)

    // Call OpenRouter API with DeepSeek R1 free model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-domain.com',
        'X-Title': 'Premarital Counseling Directory'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'system',
            content: 'You are a professional content writer specializing in local business directories and SEO content for premarital counseling services. Always return valid JSON with comprehensive, factual content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500, // Reduced for faster response
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
    const rawContent = data.choices[0].message.content
    console.log(`Raw DeepSeek response for ${stateName}:`, rawContent)

    const content = JSON.parse(rawContent)
    console.log(`Parsed DeepSeek JSON for ${stateName}:`, JSON.stringify(content, null, 2))

    // Validate accuracy against web research
    const validatedContent = validateContentAccuracy(content, webResearch, stateName)
    console.log(`Content validation completed for ${stateName}`)

    // Validate required fields
    const required = ['description', 'h1', 'intro', 'stateOverview', 'marriageStats', 'legalRequirements']
    const missing = []
    for (const field of required) {
      if (!content[field]) {
        missing.push(field)
        console.warn(`Missing field: ${field}`)
      }
    }

    if (missing.length > 0) {
      console.warn(`Available fields in response:`, Object.keys(content))
    }

    // Return the generated content with fallback field mapping using validated content
    const result = {
      title: `Premarital Counseling in ${stateName}`,
      description: validatedContent.description || content.metaDescription || `Find premarital counselors in ${stateName}`,
      h1_content: validatedContent.h1 || content.heading || `Premarital Counseling in ${stateName}`,
      intro_paragraph: validatedContent.intro || content.introduction || `Professional premarital counseling services in ${stateName}`,
      state_overview: content.stateOverview || content.overview || content.state_overview || {
        benefits: `Premarital counseling in ${stateName} helps couples prepare for marriage`,
        uniqueAspects: `${stateName} offers diverse counseling options`
      },
      marriage_statistics: content.marriageStats || content.statistics || content.marriage_statistics || {
        trends: `Growing demand for premarital counseling in ${stateName}`,
        avgMarriageAge: 28
      },
      legal_requirements: validatedContent.legalRequirements || content.requirements || content.legal_requirements || {
        process: `${stateName} marriage license requirements vary by county`,
        fees: "Fees vary by county"
      },
      popular_cities_info: content.popularCities || content.cities || content.popular_cities_info || [],
      counseling_resources: content.counselingResources || content.resources || content.counseling_resources || {
        types: ["Individual counseling", "Group sessions", "Online therapy"]
      },
      demographics: content.demographics || {
        population: "Unknown",
        medianAge: 35,
        trends: `${stateName} demographic trends support couples counseling`
      },
      generation_cost_tokens: data.usage?.total_tokens || 0,
      api_provider: 'openrouter-deepseek-r1-free',
      web_research_used: false, // Will be set based on actual sources found
      sources: extractSources(webResearch)
    }

    // Gate web_research_used flag based on actual sources found
    result.web_research_used = result.sources && result.sources.length > 0

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating state content:', error)

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

function buildStatePrompt(stateName: string, stateAbbr: string, majorCities: string[], stateData: any, webResearch: any, population?: string, characteristics?: string[]) {
  return `Generate comprehensive, SEO-optimized content for a premarital counseling directory page for the entire state of ${stateName}.

STATE DATA: ${JSON.stringify(stateData || {})}
WEB RESEARCH DATA: ${JSON.stringify(webResearch || {})}
POPULATION: ${population || 'Unknown'}
MAJOR CITIES: ${majorCities.join(', ')}
CHARACTERISTICS: ${characteristics?.join(', ') || 'General state information'}

Create concise state-wide content with:

1. META DESCRIPTION (150 chars): SEO-friendly description 
2. H1 HEADING: Compelling main heading
3. INTRO PARAGRAPH (150 words): Brief introduction about premarital counseling in ${stateName}
4. STATE OVERVIEW: Why choose counseling in ${stateName}
5. MARRIAGE STATISTICS: Key trends and statistics
6. LEGAL REQUIREMENTS: ${stateName} marriage license basics

Focus on:
- State-wide perspective (not city-specific)
- ${stateName} marriage laws and requirements (BE ACCURATE - only include verified information)
- Major metropolitan areas: ${majorCities.join(', ')}
- Cultural and demographic factors unique to ${stateName}
- Professional licensing requirements for counselors in ${stateName}

  CRITICAL ACCURACY REQUIREMENTS:
  - Only include factual, verified information from web research
  - Do NOT make up specific fees, discounts, or legal requirements
  - If unsure about specifics, use general language like "varies by county" or "typically ranges"
  - Never claim premarital counseling provides marriage license discounts or waives waiting periods unless a .gov source in WEB RESEARCH explicitly confirms it for ${stateName}
  - Do not mix rules from other states; if uncertain, avoid specifics and use "varies by county"
  - Stick to general benefits and processes rather than specific dollar amounts or legal claims

OUTPUT FORMAT: Valid JSON only:
{
  "description": "meta description for ${stateName}",
  "h1": "main heading for state page", 
  "intro": "brief intro about premarital counseling in ${stateName}",
  "stateOverview": {"benefits": "...", "uniqueAspects": "..."},
  "marriageStats": {"avgMarriageAge": 28, "trends": "..."},
  "legalRequirements": {"process": "...", "fees": "..."}
}

Make content unique, factual, and specific to ${stateName}. Focus on helpful information for couples throughout the state.`
}

// Fetch state-specific data
async function fetchStateData(stateName: string, stateAbbr: string) {
  try {
    // Get Census API key from environment
    const CENSUS_API_KEY = Deno.env.get('CENSUS_API_KEY')

    // State FIPS codes mapping
    const stateFipsCodes: { [key: string]: string } = {
      'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06', 'CO': '08',
      'CT': '09', 'DE': '10', 'FL': '12', 'GA': '13', 'HI': '15', 'ID': '16',
      'IL': '17', 'IN': '18', 'IA': '19', 'KS': '20', 'KY': '21', 'LA': '22',
      'ME': '23', 'MD': '24', 'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28',
      'MO': '29', 'MT': '30', 'NE': '31', 'NV': '32', 'NH': '33', 'NJ': '34',
      'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39', 'OK': '40',
      'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45', 'SD': '46', 'TN': '47',
      'TX': '48', 'UT': '49', 'VT': '50', 'VA': '51', 'WA': '53', 'WV': '54',
      'WI': '55', 'WY': '56'
    }

    const stateFips = stateFipsCodes[stateAbbr.toUpperCase()]

    if (stateFips && CENSUS_API_KEY) {
      // Get state-level demographic data
      const variables = ['B01003_001E', 'B19013_001E', 'B12001_001E'] // Population, Median Income, Marital Status
      const url = `https://api.census.gov/data/2022/acs/acs1?get=${variables.join(',')}&for=state:${stateFips}&key=${CENSUS_API_KEY}`

      const response = await fetch(url)
      const data = await response.json()

      if (data && data.length > 1) {
        return {
          population: parseInt(data[1][0]) || 1000000,
          medianIncome: parseInt(data[1][1]) || 65000,
          households: parseInt(data[1][2]) || 400000,
          source: 'US Census Bureau'
        }
      }
    }

    // Fallback data
    return {
      population: 1000000,
      medianIncome: 65000,
      households: 400000,
      source: 'Estimated'
    }
  } catch (error) {
    console.error('State data fetch error:', error)
    return {
      population: 1000000,
      medianIncome: 65000,
      households: 400000,
      source: 'Fallback'
    }
  }
}

// Fetch real-time web research data using Jina AI
async function fetchWebResearch(stateName: string, stateAbbr: string, majorCities: string[]) {
  try {
    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')

    if (!JINA_API_KEY) {
      console.log('Jina AI API key not found, using fallback research')
      return getFallbackResearch(stateName, majorCities)
    }

    console.log(`Starting web research for ${stateName}...`)

    // Timeout the entire web research after 15 seconds (reduced for faster response)
    const webResearchPromise = performWebResearch(stateName, JINA_API_KEY, majorCities)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Web research timeout')), 15000)
    )

    return await Promise.race([webResearchPromise, timeoutPromise])

  } catch (error) {
    console.error('Web research fetch error:', error)
    return getFallbackResearch(stateName, majorCities)
  }
}

async function performWebResearch(stateName: string, JINA_API_KEY: string, majorCities: string[]) {
  // Gov-first pass for legal facts with strict .gov queries
  const govSearches = [
    `site:*.gov ${stateName} marriage license waiting period`,
    `site:${getCountyDomain(stateName)} marriage license fees`,
    `site:*.gov ${stateName} marriage blood test requirements`
  ]

  // General searches for pricing and counseling info
  const generalSearches = [
    `${stateName} premarital counseling average cost pricing 2024 therapists`,
    `${stateName} marriage license requirements official`
  ]

  const allSearches = [...govSearches, ...generalSearches]
  const searchResults = []
  let govSearchTimeout = false

  // Process searches with different timeouts for gov vs general
  for (let i = 0; i < allSearches.length; i++) {
    const query = allSearches[i]
    const isGovSearch = i < govSearches.length

    try {
      // Gov searches get longer timeout, general searches get shorter
      const controller = new AbortController()
      const timeout = isGovSearch ? 12000 : 8000
      const timeoutId = setTimeout(() => {
        controller.abort()
        if (isGovSearch) {
          govSearchTimeout = true
          console.warn(`⏰ Gov search timeout for: ${query}`)
        }
      }, timeout)

      const url = `https://s.jina.ai/search?q=${encodeURIComponent(query)}&size=3`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${JINA_API_KEY}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        // Log the raw response to see what Jina returns
        console.log(`Raw Jina response for "${query}":`, JSON.stringify(data, null, 2))

        // Jina AI returns results in an array under `data` or top-level depending on version
        const results = Array.isArray(data) ? data : (Array.isArray((data as any).data) ? (data as any).data : [])
        searchResults.push({
          query: query,
          results: results,
          isGovSearch: isGovSearch
        })

        console.log(`Search completed for: ${query} (${results.length} results)`)

        // Log key info from each result
        results.forEach((result, index) => {
          console.log(`   Result ${index + 1}: ${result.title || result.url || 'No title'} - ${(result.content || result.snippet || '').substring(0, 100)}...`)
        })

      } else {
        const errorText = await response.text()
        console.warn(`Search failed with status ${response.status} for: ${query} - ${errorText}`)
      }

      // Longer delay between requests to be nice to free API
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`Search timeout for: ${query}`)
      } else {
        console.warn(`Search failed for: ${query}`, error)
      }
    }
  }

  console.log(`Web research completed for ${stateName} with ${searchResults.length} search results`)

  const analysisResult = {
    searchResults: searchResults,
    competitorAnalysis: extractCompetitorInfo(searchResults),
    trendingTopics: extractTrends(searchResults),
    pricingInsights: extractPricing(searchResults),
    legalUpdates: extractLegalInfo(searchResults),
    timestamp: new Date().toISOString()
  }

  // Log the processed analysis
  console.log(`Extracted competitor analysis: ${analysisResult.competitorAnalysis.length} items`)
  console.log(`Extracted trending topics: ${analysisResult.trendingTopics.length} items`)
  console.log(`Extracted pricing insights: ${analysisResult.pricingInsights.length} items`)
  console.log(`Extracted legal updates: ${analysisResult.legalUpdates.length} items`)

  return analysisResult
}

// Extract competitor information from search results
function extractCompetitorInfo(searchResults: any[]) {
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

  return competitors.slice(0, 5) // Top 5 competitors
}

// Extract trending topics and keywords
function extractTrends(searchResults: any[]) {
  const trends = []

  for (const search of searchResults) {
    if (search.query.includes('trends') || search.query.includes('2024')) {
      for (const result of search.results || []) {
        if (result.content || result.snippet) {
          trends.push({
            topic: result.title,
            insight: result.content || result.snippet
          })
        }
      }
    }
  }

  return trends.slice(0, 3)
}

// Extract pricing information
function extractPricing(searchResults: any[]) {
  const pricing = []

  for (const search of searchResults) {
    if (search.query.includes('pricing') || search.query.includes('costs')) {
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

// Extract legal/requirements information
function extractLegalInfo(searchResults: any[]) {
  const legal = []

  for (const search of searchResults) {
    if (search.query.includes('requirements') || search.query.includes('laws')) {
      for (const result of search.results || []) {
        if (result.content || result.snippet) {
          legal.push({
            source: result.title,
            info: result.content || result.snippet
          })
        }
      }
    }
  }

  return legal.slice(0, 2)
}

// Validate content accuracy against web research to prevent false claims
function validateContentAccuracy(content: any, webResearch: any, stateName: string) {
  const validatedContent = { ...content }

  // Load baseline state rules for known safe facts
  const stateRules = getBaselineStateRules(stateName)

  // Check for common false claims and flag them
  if (content.legalRequirements) {
    const legalText = JSON.stringify(content.legalRequirements).toLowerCase()

    // Flag potential false discount claims
    if (legalText.includes('discount') || legalText.includes('reduce') || legalText.includes('lower')) {
      console.warn(`Potential false discount claim detected for ${stateName}`)

      // Remove discount claims unless supported by web research
      const hasDiscountEvidence = webResearch?.searchResults?.some((search: any) =>
        search.results?.some((result: any) =>
          (result.content || result.snippet || '').toLowerCase().includes('discount') &&
          (result.content || result.snippet || '').toLowerCase().includes('premarital')
        )
      )

      if (!hasDiscountEvidence) {
        console.log(`Removing unverified discount claims for ${stateName}`)
        validatedContent.legalRequirements = {
          ...content.legalRequirements,
          fees: content.legalRequirements.fees?.replace(/discount|reduce|lower/gi, '') || 'Varies by county',
          process: content.legalRequirements.process?.replace(/discount|reduce|lower/gi, '') || `${stateName} marriage license requirements vary by county`
        }
      }
    }

    // Validate specific fee amounts against web research
    const feeMatch = legalText.match(/\$(\d+)/g)
    if (feeMatch && feeMatch.length > 0) {
      const hasValidFeeData = webResearch?.searchResults?.some((search: any) =>
        search.results?.some((result: any) =>
          (result.content || result.snippet || '').toLowerCase().includes('fee') ||
          (result.content || result.snippet || '').toLowerCase().includes('cost')
        )
      )

      if (!hasValidFeeData) {
        console.log(`Generalizing unverified fee amounts for ${stateName}`)
        validatedContent.legalRequirements = {
          ...validatedContent.legalRequirements,
          fees: 'Fees vary by county - contact your local clerk'
        }
      }
    }

    // Validate waiting period claims
    const mentionsWaitingPeriod = legalText.includes('waiting period') || legalText.includes('waive')
    if (mentionsWaitingPeriod) {
      const hasWaitingEvidence = webResearch?.searchResults?.some((search: any) =>
        search.results?.some((result: any) => {
          const text = (result.content || result.snippet || '').toLowerCase()
          const url = (result.url || result.link || '').toLowerCase()
          return text.includes('waiting period') && (url.includes('.gov') || text.includes('county clerk'))
        })
      )

      if (!hasWaitingEvidence) {
        console.log(`Generalizing unverified waiting period claim for ${stateName}`)
        const existing = validatedContent.legalRequirements || {}
        const processText = typeof existing.process === 'string' && existing.process.length > 0
          ? existing.process.replace(/waiting period.*?(\.|$)/gi, '').trim()
          : `${stateName} marriage license requirements vary by county`

        validatedContent.legalRequirements = {
          ...existing,
          process: processText,
          waitingPeriod: 'Varies by county — confirm with the local clerk'
        }
      }
    }
  }

  // Validate pricing claims in other sections
  if (content.stateOverview?.uniqueAspects) {
    const overviewText = content.stateOverview.uniqueAspects.toLowerCase()
    if (overviewText.includes('discount') || overviewText.includes('cheaper') || overviewText.includes('lower cost')) {
      console.warn(`Potential false pricing claim in overview for ${stateName}`)
      validatedContent.stateOverview = {
        ...content.stateOverview,
        uniqueAspects: content.stateOverview.uniqueAspects.replace(/discount|cheaper|lower cost/gi, 'competitive pricing')
      }
    }
  }

  // Validate marriage statistics - sanitize numeric stats without official sources
  if (content.marriageStats) {
    const hasOfficialStats = webResearch?.searchResults?.some((search: any) =>
      search.results?.some((result: any) => {
        const url = (result.url || result.link || result.uri || result.open_url || result.source_url || '').toLowerCase()
        const text = (result.content || result.snippet || '').toLowerCase()
        return (url.includes('.gov') || url.includes('cdc.gov') || url.includes('census.gov')) &&
          (text.includes('marriage') || text.includes('statistic') || text.includes('demographic'))
      })
    )

    const hasNumericValues = content.marriageStats.avgMarriageAge || content.marriageStats.annualMarriages || content.marriageStats.divorceRate

    if (!hasOfficialStats && hasNumericValues) {
      console.log(`Sanitizing numeric marriage stats without official sources for ${stateName}`)
      validatedContent.marriageStats = {
        trends: content.marriageStats.trends || `Growing interest in premarital counseling supports couples in ${stateName}`,
        // Remove specific numeric values, use general language
        avgMarriageAge: undefined,
        annualMarriages: undefined,
        divorceRate: undefined,
        note: 'Contact local vital records for current statistics'
      }
    } else if (hasOfficialStats) {
      console.log(`Official statistics sources found for ${stateName}, keeping numeric values`)
    }
  }

  // Validate blood test claims
  if (content.legalRequirements?.bloodTest) {
    const bloodTestText = content.legalRequirements.bloodTest.toLowerCase()
    const mentionsBloodTest = bloodTestText.includes('not required') || bloodTestText.includes('no blood test')

    if (mentionsBloodTest) {
      const hasGovSource = webResearch?.searchResults?.some((search: any) =>
        search.results?.some((result: any) => {
          const url = (result.url || result.link || result.uri || result.open_url || result.source_url || '').toLowerCase()
          const text = (result.content || result.snippet || '').toLowerCase()
          return url.includes('.gov') && (text.includes('blood test') || text.includes('medical exam'))
        })
      )

      const hasBaselineRule = stateRules?.legalRequirements?.bloodTest

      if (!hasGovSource && !hasBaselineRule) {
        console.log(`Removing unverified blood test claim for ${stateName}`)
        validatedContent.legalRequirements = {
          ...validatedContent.legalRequirements,
          bloodTest: 'Confirm blood test requirements with local county clerk'
        }
      } else {
        console.log(`Blood test claim verified for ${stateName}`)
      }
    }
  }

  // Apply baseline state rules if available
  if (stateRules && validatedContent.legalRequirements) {
    console.log(`Applying baseline rules for ${stateName}`)
    validatedContent.legalRequirements = {
      ...validatedContent.legalRequirements,
      ...stateRules.legalRequirements
    }
  }

  return validatedContent
}

// Get baseline state rules for known safe facts
function getBaselineStateRules(stateName: string): any {
  const stateRules: { [key: string]: any } = {
    'Nevada': {
      legalRequirements: {
        waitingPeriod: 'None',
        bloodTestRequired: false,
        bloodTest: 'Not required',
        feesPolicy: 'Varies by county',
        fees: 'Varies by county',
        identification: 'Valid ID required for both parties',
        process: 'Nevada marriage license requirements vary by county - contact your local clerk',
        notes: 'No waiting period or blood test required in Nevada'
      }
    },
    'Florida': {
      legalRequirements: {
        waitingPeriod: '3 days (waived with premarital counseling certificate)',
        bloodTestRequired: false,
        bloodTest: 'Not required',
        feesPolicy: 'Varies by county',
        fees: 'Varies by county',
        identification: 'Valid ID and Social Security numbers required',
        process: 'Florida marriage license requirements include waiting period unless waived',
        notes: 'Premarital counseling can waive the 3-day waiting period'
      }
    },
    'Texas': {
      legalRequirements: {
        waitingPeriod: '72 hours (waived with premarital education)',
        bloodTestRequired: false,
        bloodTest: 'Not required',
        feesPolicy: 'Varies by county',
        fees: 'Varies by county',
        identification: 'Valid ID required',
        process: 'Texas marriage license has 72-hour waiting period unless waived with education',
        notes: 'Premarital education can reduce waiting period and fees'
      }
    },
    'California': {
      legalRequirements: {
        waitingPeriod: 'None',
        bloodTestRequired: false,
        bloodTest: 'Not required',
        feesPolicy: 'Varies by county',
        fees: 'Varies by county',
        identification: 'Valid ID required for both parties',
        process: 'California marriage license requirements vary by county',
        notes: 'No waiting period or blood test required in California'
      }
    }
  }

  return stateRules[stateName] || null
}

// Get common county domain for .gov searches
function getCountyDomain(stateName: string): string {
  const countyDomains: { [key: string]: string } = {
    'Nevada': 'clarkcountynv.gov',
    'Florida': 'miamidade.gov',
    'Texas': 'harriscountytx.gov',
    'California': 'lacounty.gov'
  }

  return countyDomains[stateName] || '*.gov'
}

// Extract sources from web research with expanded field mapping
function extractSources(webResearch: any): Array<{ title: string, url: string }> {
  if (!webResearch?.searchResults) return []

  const sources: Array<{ title: string, url: string }> = []

  for (const search of webResearch.searchResults) {
    for (const result of (search.results || [])) {
      // Try multiple URL field variations that Jina might return
      const url = result.url || result.link || result.uri || result.open_url || result.source_url
      const title = result.title || result.name || url

      if (url && title) {
        sources.push({ title, url })
      }
    }
  }

  // Remove duplicates and limit to top 5
  const uniqueSources = sources.filter((source, index, self) =>
    index === self.findIndex(s => s.url === source.url)
  )

  return uniqueSources.slice(0, 5)
}

// Fallback research when Jina AI is unavailable
function getFallbackResearch(stateName: string, majorCities: string[]) {
  return {
    searchResults: [],
    competitorAnalysis: [],
    trendingTopics: [
      { topic: "Premarital Counseling Trends 2024", insight: "Increasing demand for online and hybrid counseling sessions" },
      { topic: "Modern Relationship Challenges", insight: "Focus on digital communication and work-life balance" }
    ],
    pricingInsights: [
      { source: "Industry Average", info: "Premarital counseling sessions typically range $100-$200 per hour" }
    ],
    legalUpdates: [
      { source: "State Requirements", info: `${stateName} marriage license requirements vary by county` }
    ],
    timestamp: new Date().toISOString(),
    source: 'fallback-data'
  }
}
