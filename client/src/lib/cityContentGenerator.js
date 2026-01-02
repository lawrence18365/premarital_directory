import CityContentCache from './cityContentCache'
import { supabase } from './supabaseClient'

// Main orchestrator for city content generation
class CityContentGenerator {
  constructor() {
    this.costLimit = 0.50 // Max $0.50 per generation
  }
  
  // Main entry point - check cache first, generate if needed
  async getOrGenerateCityContent(state, city, options = {}) {
    const { forceRegenerate = false } = options
    
    console.log(`Getting content for ${city}, ${state}`)
    
    // Check cache first (unless force regenerate)
    if (!forceRegenerate) {
      const cached = await CityContentCache.getCachedContent(state, city)
      if (cached) {
        console.log(`Using cached content for ${city}, ${state}`)
        return this.formatContentForDisplay(cached)
      }
    }
    
    // Generate content - no fallback
    return await this.generateAndCacheContent(state, city)
  }
  
  // Generate new content via Supabase Edge Function
  async generateAndCacheContent(state, city) {
    console.log(`Calling Edge Function for ${city}, ${state}`)
    
    const { data, error } = await supabase.functions.invoke('generate-city-content', {
      body: { state, city }
    })

    if (error) {
      console.error('Edge Function Error:', error)
      throw error
    }

    return this.formatContentForDisplay(data)
  }
  
  
  // Format cached/generated content for page display
  formatContentForDisplay(content) {
    return {
      title: content.title,
      description: content.description,
      h1: content.h1_content,
      intro: content.intro_paragraph,
      
      // Structured content sections
      sections: {
        marriageStats: content.marriage_statistics,
        venues: content.local_venues,
        pricing: content.pricing_insights,
        legal: content.legal_requirements,
        nearby: content.nearby_cities,
        demographics: content.demographics
      },
      
      // Meta info
      generated: content.content_generated_at,
      provider: content.api_provider,
      isGenerated: true
    }
  }
  
  
  // Get state abbreviation from full name
  getStateAbbr(stateName) {
    const stateMap = {
      'alaska': 'AK', 'alabama': 'AL', 'arkansas': 'AR', 'arizona': 'AZ',
      'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
      'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'iowa': 'IA',
      'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'kansas': 'KS',
      'kentucky': 'KY', 'louisiana': 'LA', 'massachusetts': 'MA', 'maryland': 'MD',
      'maine': 'ME', 'michigan': 'MI', 'minnesota': 'MN', 'missouri': 'MO',
      'mississippi': 'MS', 'montana': 'MT', 'north-carolina': 'NC', 'north-dakota': 'ND',
      'nebraska': 'NE', 'new-hampshire': 'NH', 'new-jersey': 'NJ', 'new-mexico': 'NM',
      'nevada': 'NV', 'new-york': 'NY', 'ohio': 'OH', 'oklahoma': 'OK',
      'oregon': 'OR', 'pennsylvania': 'PA', 'rhode-island': 'RI', 'south-carolina': 'SC',
      'south-dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
      'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west-virginia': 'WV',
      'wisconsin': 'WI', 'wyoming': 'WY'
    }
    
    return stateMap[stateName.toLowerCase()]
  }
  
  // Check if request is from a bot/crawler
  static detectBot(userAgent) {
    if (!userAgent) return false
    
    const botPatterns = [
      'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
      'facebookexternalhit', 'twitterbot', 'linkedinbot', 'pinterest',
      'crawler', 'spider', 'bot', 'archiver', 'scraper'
    ]
    
    return botPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern)
    )
  }
  
  // Get generation statistics  
  async getStats() {
    return await CityContentCache.getCacheStats()
  }
}

export default CityContentGenerator
