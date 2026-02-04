import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getAllowedOrigins, getCorsHeaders, isOriginAllowed, requireAdmin } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    const origin = req.headers.get('origin')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const internalKey = Deno.env.get('INTERNAL_API_KEY')
    const providedInternalKey = req.headers.get('x-internal-api-key')
    const isInternal = internalKey && providedInternalKey === internalKey

    if (!isInternal) {
      const allowedOrigins = getAllowedOrigins()
      if (!isOriginAllowed(origin, allowedOrigins)) {
        return new Response(
          JSON.stringify({ error: 'Origin not allowed' }),
          { status: 403, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
        )
      }

      const adminResult = await requireAdmin(req, supabaseUrl, supabaseAnonKey, supabaseServiceKey)
      if (!adminResult.ok) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
        )
      }
    }

    const { state, city } = await req.json()

    if (!state || !city) {
      throw new Error('Missing state or city parameters')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Check Cache
    const { data: cachedContent, error: cacheError } = await supabase
      .from('city_content_cache')
      .select('*')
      .eq('state_slug', state)
      .eq('city_slug', city.toLowerCase().replace(/\s+/g, '-')) // Assuming slugs
      .maybeSingle()

    if (cachedContent) {
      console.log(`Cache hit for ${city}, ${state}`)
      return new Response(JSON.stringify(cachedContent.content_data), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      })
    }

    // 2. Optional: Fetch Live Data with Tavily (if configured)
    const tavilyApiKey = Deno.env.get('TAVILY_API_KEY')
    let searchContext = ''

    if (tavilyApiKey) {
      try {
        console.log(`Searching web for ${city}, ${state} data...`)
        const searchResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query: `marriage license cost requirements ${city} ${state} 2025 premarital counseling average cost`,
            search_depth: "basic",
            include_answer: true,
            max_results: 3
          })
        })

        const searchData = await searchResponse.json()
        if (searchData.results) {
          searchContext = `
            REAL-TIME SEARCH CONTEXT (Use this for accurate costs/laws):
            ${searchData.answer ? `Summary: ${searchData.answer}` : ''}
            ${searchData.results.map((r: any) => `- ${r.content}`).join('\n')}
          `
        }
      } catch (err) {
        console.error('Search failed:', err)
        // Continue without search context
      }
    }

    // 3. Generate Content with Gemini (Free Tier)
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const prompt = `
      Write a comprehensive, SEO-optimized guide for "Premarital Counseling in ${city}, ${state}".
      
      ${searchContext}

      Format the output as a JSON object with the following structure:
      {
        "title": "Page Title (include year)",
        "description": "Meta description",
        "h1_content": "H1 Heading",
        "intro_paragraph": "A 2-3 sentence intro specific to ${city}...",
        "marriage_statistics": { "trends": "...", "annualMarriages": "..." },
        "pricing_insights": { "sessionCost": "...", "insurance": "..." },
        "local_venues": "Mention 2-3 popular wedding venues in ${city} as context...",
        "legal_requirements": "Specific marriage license requirements (fee, waiting period) for ${state}..."
      }
      
      IMPORTANT:
      - Use the SEARCH CONTEXT provided above to fill in accurate pricing and legal requirements.
      - If search context contains specific fees (e.g. "$82.50"), use them.
      - Do not include citations or markdown in the JSON values.
      - Ensure the output is valid JSON.
    `

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    const geminiData = await response.json()
    const generatedText = geminiData.candidates[0].content.parts[0].text
    
    // Clean up JSON markdown if present
    const cleanedJson = generatedText.replace(/```json/g, '').replace(/```/g, '').trim()
    const contentData = JSON.parse(cleanedJson)

    // 3. Cache the Result
    const { error: insertError } = await supabase
      .from('city_content_cache')
      .insert({
        state_slug: state,
        city_slug: city.toLowerCase().replace(/\s+/g, '-'),
        content_data: contentData,
        state_abbr: 'XX', // You might want to pass this or look it up
        provider: 'gemini'
      })

    if (insertError) {
      console.error('Failed to cache content:', insertError)
    }

    return new Response(JSON.stringify(contentData), {
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  }
})
