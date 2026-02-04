import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getAllowedOrigins, getCorsHeaders, isOriginAllowed, requireAdmin } from "../_shared/auth.ts"

interface ContentRequest {
  type: 'city' | 'state' | 'blog'
  location: string
  state?: string
  batch?: boolean
  count?: number
}

// Free AI model endpoints (rate limited but free)
const AI_MODELS = {
  // Hugging Face Inference API (free tier)
  HUGGINGFACE: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
  // Ollama local model (if running)
  OLLAMA: 'http://localhost:11434/api/generate',
  // Together AI (free tier)
  TOGETHER: 'https://api.together.xyz/inference'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    const origin = req.headers.get('origin')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { type, location, state, batch = false, count = 1 }: ContentRequest = await req.json()

    if (!type || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, location' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      )
    }

    // Get local data for context
    const locationData = await getLocationData(supabase, location, state)
    
    let generatedContent = []

    if (batch) {
      // Generate multiple pieces of content
      for (let i = 0; i < count; i++) {
        const content = await generateLocationContent(type, location, state, locationData, i)
        generatedContent.push(content)
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } else {
      // Generate single piece of content
      const content = await generateLocationContent(type, location, state, locationData)
      generatedContent.push(content)
    }

    // Save to database
    for (const content of generatedContent) {
      await saveContentToDatabase(supabase, content)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        contentGenerated: generatedContent.length,
        content: generatedContent
      }),
      { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating SEO content:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})

async function getLocationData(supabase: any, location: string, state?: string) {
  // Get existing profiles in the area
  let query = supabase
    .from('profiles')
    .select('profession, specialties')

  if (state) {
    query = query.eq('state_province', state).ilike('city', `%${location}%`)
  } else {
    query = query.eq('state_province', location)
  }

  const { data: profiles } = await query.limit(50)

  // Aggregate data
  const professions = [...new Set(profiles?.map(p => p.profession) || [])]
  const specialties = [...new Set(profiles?.flatMap(p => p.specialties || []) || [])]

  return {
    profileCount: profiles?.length || 0,
    topProfessions: professions.slice(0, 5),
    topSpecialties: specialties.slice(0, 8),
    demographics: await getDemographicData(location, state),
    localFacts: await getLocalFacts(location, state)
  }
}

async function getDemographicData(location: string, state?: string) {
  // Simulated demographic data - in production, use real APIs
  const demographics = {
    'California': { population: '39.5M', marriageRate: '6.2/1000', avgAge: 32 },
    'Texas': { population: '29.5M', marriageRate: '7.1/1000', avgAge: 34 },
    'Florida': { population: '21.5M', marriageRate: '7.8/1000', avgAge: 42 },
    'New York': { population: '19.8M', marriageRate: '5.9/1000', avgAge: 36 },
    // Add more states...
  }

  return demographics[state || location] || { 
    population: 'varied', 
    marriageRate: '6.5/1000', 
    avgAge: 33 
  }
}

async function getLocalFacts(location: string, state?: string) {
  // Local facts that make content unique
  const facts = {
    'Los Angeles': ['second largest city', 'diverse cultural landscape', 'entertainment industry hub'],
    'Houston': ['space city', 'oil capital', 'diverse food scene'],
    'Miami': ['international gateway', 'beautiful beaches', 'vibrant nightlife'],
    // Add more cities...
  }

  return facts[location] || ['unique community', 'local traditions', 'growing population']
}

async function generateLocationContent(
  type: string, 
  location: string, 
  state?: string, 
  locationData?: any,
  variant: number = 0
) {
  const templates = getContentTemplates(type, variant)
  const template = templates[Math.floor(Math.random() * templates.length)]

  // Use free AI model to enhance content
  const enhancedContent = await enhanceWithAI(template, location, state, locationData)

  return {
    type,
    location,
    state,
    title: generateTitle(type, location, state, variant),
    content: enhancedContent,
    meta_description: generateMetaDescription(type, location, state),
    keywords: generateKeywords(type, location, state),
    slug: generateSlug(type, location, state),
    created_at: new Date().toISOString()
  }
}

function getContentTemplates(type: string, variant: number) {
  const templates = {
    city: [
      // Template 1: Professional Focus
      `Finding the right premarital counselor is crucial for couples preparing for marriage. In {location}, {state}, couples have access to experienced professionals who understand the unique challenges of building a lasting relationship.

      ## Why Premarital Counseling Matters in {location}

      With {profileCount} qualified professionals in the area, couples in {location} can choose from specialists in {topSpecialties}. Local counselors understand the cultural dynamics and community values that make {location} special.

      ## Top Specialties Available

      Our {location} professionals specialize in:
      {specialtiesList}

      ## What to Expect

      Premarital counseling typically covers communication skills, conflict resolution, financial planning, and intimacy. {location} counselors often incorporate local cultural considerations and family dynamics.

      ## Getting Started

      Ready to strengthen your relationship? Browse our verified professionals in {location}, {state} and schedule your first consultation today.`,

      // Template 2: Community Focus
      `Marriage is a beautiful journey, and couples in {location}, {state} are taking proactive steps to build strong foundations through premarital counseling.

      ## The {location} Advantage

      {location} offers a unique environment for couples to grow together. With {localFacts}, our community understands the importance of strong relationships.

      ## Local Marriage Statistics

      - Population: {population}
      - Marriage rate: {marriageRate}
      - Average marriage age: {avgAge}

      ## Professional Services Available

      {location} hosts {profileCount} certified premarital counselors, including:
      {professionsList}

      ## Building Your Future Together

      Whether you're planning a wedding at local venues or building a life in {location}, premarital counseling provides the tools you need for success.`,

      // Template 3: Practical Guide
      `Preparing for marriage in {location}, {state}? Our comprehensive guide connects you with top-rated premarital counselors in your area.

      ## Complete Guide to Premarital Counseling in {location}

      Choosing the right counselor is essential. Here's what you need to know:

      ### Assessment and Compatibility
      Local professionals use proven methods to assess relationship strengths and growth areas.

      ### Communication Training
      Learn effective communication techniques tailored to {location}'s cultural context.

      ### Conflict Resolution
      Develop healthy conflict resolution skills that work in real-world situations.

      ## Finding Your Counselor

      With options ranging from {topProfessions}, you'll find the perfect match for your needs in {location}.`
    ],

    state: [
      // State-level templates with different angles
      `{location} couples are choosing premarital counseling to build stronger marriages. Discover why relationship preparation is thriving across the state.

      ## Premarital Counseling Across {location}

      From bustling cities to charming small towns, {location} offers comprehensive premarital counseling services. With {profileCount} professionals statewide, couples have unprecedented access to relationship preparation resources.

      ## State-Specific Considerations

      {location} counselors understand local family dynamics, cultural traditions, and community values that influence modern relationships.

      ## Major Service Areas

      Our network covers all major metropolitan areas and rural communities throughout {location}, ensuring every couple has access to quality premarital counseling.`
    ],

    blog: [
      // Blog post templates
      `# The Complete Guide to Premarital Counseling in {location}

      Planning your wedding in {location}? Don't forget about preparing for your marriage itself. Here's everything you need to know about premarital counseling in your area.

      ## Why Local Matters

      Choosing a premarital counselor in {location} means working with someone who understands your community, culture, and local dynamics.

      ## What to Look For

      When selecting a premarital counselor, consider their specialties, approach, and experience with couples like you.`
    ]
  }

  return templates[type] || templates.city
}

async function enhanceWithAI(template: string, location: string, state?: string, locationData?: any) {
  // Replace placeholders with real data
  let content = template
    .replace(/{location}/g, location)
    .replace(/{state}/g, state || '')
    .replace(/{profileCount}/g, locationData?.profileCount?.toString() || '15')
    .replace(/{population}/g, locationData?.demographics?.population || 'growing')
    .replace(/{marriageRate}/g, locationData?.demographics?.marriageRate || '6.5/1000')
    .replace(/{avgAge}/g, locationData?.demographics?.avgAge?.toString() || '33')

  // Format lists
  if (locationData?.topSpecialties) {
    const specialtiesList = locationData.topSpecialties
      .map((s: string) => `- ${s}`)
      .join('\n')
    content = content.replace(/{specialtiesList}/g, specialtiesList)
  }

  if (locationData?.topProfessions) {
    const professionsList = locationData.topProfessions
      .map((p: string) => `- ${p}`)
      .join('\n')
    content = content.replace(/{professionsList}/g, professionsList)
  }

  if (locationData?.localFacts) {
    const factsText = locationData.localFacts.join(', ')
    content = content.replace(/{localFacts}/g, factsText)
  }

  // Clean up any remaining placeholders
  content = content.replace(/{[^}]+}/g, '')

  return content
}

function generateTitle(type: string, location: string, state?: string, variant: number = 0) {
  const titles = {
    city: [
      `Premarital Counseling in ${location}, ${state} | Expert Relationship Preparation`,
      `Find Top Premarital Counselors in ${location} | WeddingCounselors.com`,
      `${location} Premarital Counseling Services | Build a Strong Marriage Foundation`
    ],
    state: [
      `Premarital Counseling in ${location} | Statewide Professional Directory`,
      `${location} Marriage Preparation | Find Certified Counselors Near You`
    ],
    blog: [
      `Complete Guide to Premarital Counseling in ${location}`,
      `Why Couples in ${location} Choose Premarital Counseling`
    ]
  }

  const typeList = titles[type] || titles.city
  return typeList[variant % typeList.length]
}

function generateMetaDescription(type: string, location: string, state?: string) {
  const descriptions = {
    city: `Find qualified premarital counselors in ${location}, ${state}. Connect with certified professionals who specialize in relationship preparation and marriage counseling.`,
    state: `Discover premarital counseling services across ${location}. Browse certified counselors, read reviews, and book consultations with relationship experts.`,
    blog: `Expert guide to premarital counseling in ${location}. Learn about benefits, what to expect, and how to choose the right counselor for your relationship.`
  }

  return descriptions[type] || descriptions.city
}

function generateKeywords(type: string, location: string, state?: string) {
  const base = [
    `premarital counseling ${location}`,
    `marriage counseling ${location}`,
    `relationship counselor ${location}`,
    'pre-marriage therapy',
    'couples counseling',
    'marriage preparation'
  ]

  if (state) {
    base.push(`premarital counseling ${state}`)
  }

  return base
}

function generateSlug(type: string, location: string, state?: string) {
  const baseSlug = location.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const stateSlug = state?.toLowerCase().replace(/[^a-z0-9]/g, '-')
  
  return `${type}-${baseSlug}${stateSlug ? `-${stateSlug}` : ''}`
}

async function saveContentToDatabase(supabase: any, content: any) {
  const { error } = await supabase
    .from('seo_content')
    .upsert(content, { onConflict: 'slug' })

  if (error) {
    console.error('Error saving content:', error)
    throw error
  }
}
