import AIContentGenerator from './aiContentGenerator'
import DataFetcher from './dataFetcher' 
import CityContentCache from './cityContentCache'

// Main orchestrator for city content generation
class CityContentGenerator {
  constructor() {
    this.aiGenerator = new AIContentGenerator()
    this.dataFetcher = new DataFetcher()
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
        console.log(`✅ Using cached content for ${city}, ${state}`)
        return this.formatContentForDisplay(cached)
      }
    }
    
    // Generate content - no fallback
    console.log(`🤖 Generating AI content for ${city}, ${state}`)
    return await this.generateAndCacheContent(state, city)
  }
  
  // Generate new content and cache it - no fallback, either works or throws
  async generateAndCacheContent(state, city) {
    // Get state abbreviation
    const stateAbbr = this.getStateAbbr(state)
    if (!stateAbbr) {
      throw new Error(`Unknown state: ${state}`)
    }
    
    console.log(`📊 Preparing data for ${city}, ${stateAbbr}`)
    
    // Prepare basic city data
    const cityData = {
      city,
      state,
      stateAbbr
    }
    
    // Estimate cost before generation
    const estimatedCost = this.aiGenerator.estimateCost(JSON.stringify(cityData))
    
    if (estimatedCost > this.costLimit) {
      throw new Error(`Estimated cost $${estimatedCost.toFixed(4)} exceeds limit $${this.costLimit}`)
    }
    
    console.log(`🤖 Generating AI content (estimated cost: $${estimatedCost.toFixed(4)})`)
    
    // Generate content with AI
    const generatedContent = await this.aiGenerator.generateCityContent(cityData)
    
    // Cache the generated content
    await CityContentCache.setCachedContent(state, city, stateAbbr, generatedContent)
    
    console.log(`✅ Generated and cached content for ${city}, ${state}`)
    console.log(`💰 Actual tokens used: ${generatedContent.generation_cost_tokens}`)
    
    return this.formatContentForDisplay(generatedContent)
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