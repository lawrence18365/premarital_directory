import AIContentGenerator from './aiContentGenerator'
import DataFetcher from './dataFetcher' 

// State content generator for AI-powered state page content
class StateContentGenerator {
  constructor() {
    this.aiGenerator = new AIContentGenerator()
    this.dataFetcher = new DataFetcher()
    this.costLimit = 0.50 // Max $0.50 per generation
    this.functionURL = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/generate-state-content`
    this.CACHE_VERSION = '2025-08-11-accuracy-1'
  }
  
  // Main entry point - generate state content with AI
  async getOrGenerateStateContent(state, stateConfig, options = {}) {
    const { forceRegenerate = false } = options
    
    console.log(`Getting AI content for ${stateConfig.name}`)
    
    // Check cache first (unless force regenerate)
    if (!forceRegenerate) {
      const cached = await this.getCachedStateContent(state)
      if (cached) {
    console.log(`Using cached content for ${stateConfig.name}`)
        return this.formatContentForDisplay(cached)
      }
    }
    
    // Generate content with AI - no fallback
    return await this.generateAndCacheStateContent(state, stateConfig)
  }
  
  // Generate new state content and cache it
  async generateAndCacheStateContent(state, stateConfig) {
    console.log(`Preparing data for ${stateConfig.name}`)
    
    // Prepare state data for AI generation
    const stateData = {
      state: state,
      stateName: stateConfig.name,
      stateAbbr: stateConfig.abbr,
      majorCities: stateConfig.major_cities,
      population: stateConfig.population || 'Unknown',
      characteristics: stateConfig.characteristics || []
    }
    
    // Estimate cost before generation
    const estimatedCost = this.aiGenerator.estimateCost(JSON.stringify(stateData))
    
    if (estimatedCost > this.costLimit) {
      throw new Error(`Estimated cost $${estimatedCost.toFixed(4)} exceeds limit $${this.costLimit}`)
    }
    
    console.log(`Generating AI content (estimated cost: $${estimatedCost.toFixed(4)})`)
    
    // Call the state content generation function - NO FALLBACKS
    // Add client-side timeout to prevent infinite loading
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout - Jina research takes time
    
    try {
      const response = await fetch(this.functionURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(stateData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
    
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Supabase Function error: ${response.status} - ${error}`)
      }
      
      const generatedContent = await response.json()
      
      if (generatedContent.error) {
        throw new Error(`Function error: ${generatedContent.error}`)
      }
      
      // Cache the generated content
      await this.setCachedStateContent(state, stateConfig.abbr, generatedContent)
      
      console.log(`Generated and cached content for ${stateConfig.name}`)
      console.log(`Actual tokens used: ${generatedContent.generation_cost_tokens}`)
      console.log(`Content source: ${generatedContent.api_provider}`)
      
      const formattedContent = this.formatContentForDisplay(generatedContent)
      console.log(`Data includes Jina research: ${formattedContent.jinaDataUsed ? 'YES - Real web data used!' : 'NO - Pure AI generation only'}`)
      
      return formattedContent
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error(`Content generation timeout after 45 seconds for ${stateConfig.name}`)
      }
      throw fetchError
    }
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
        overview: content.state_overview,
        marriageStats: content.marriage_statistics, 
        legalRequirements: content.legal_requirements,
        popularCities: content.popular_cities_info,
        counselingResources: content.counseling_resources,
        demographics: content.demographics
      },
      
      // Meta info with data source indicators
      generated: content.content_generated_at,
      provider: content.api_provider,
      isGenerated: true,
      webResearchUsed: content.web_research_used || false,
      sources: content.sources || [],
      dataSource: (content.sources && content.sources.length > 0) ? 'Real web data' : 'AI-generated content only',
      jinaDataUsed: (content.sources && content.sources.length > 0) || false
    }
  }
  
  // Simple cache management (you might want to implement proper database caching)
  async getCachedStateContent(state) {
    try {
      const legacyKey = `state_content_${state}`
      const cacheKey = `state_content_${state}_${this.CACHE_VERSION}`
      // Clean up legacy key if present
      if (localStorage.getItem(legacyKey)) {
        localStorage.removeItem(legacyKey)
      }
      const cached = localStorage.getItem(cacheKey)
      
      if (cached) {
        const parsed = JSON.parse(cached)
        // Check if cache is less than 24 hours old
        const cacheAge = Date.now() - parsed.timestamp
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        
        if (cacheAge < maxAge) {
          console.log(`Using cached content for ${state} (age: ${Math.round(cacheAge / (60 * 60 * 1000))}h)`)
          return parsed.content
        } else {
          console.log(`Cache expired for ${state}, generating fresh content`)
        }
      }
      
      return null
    } catch (error) {
      console.error('Cache retrieval error:', error)
      return null
    }
  }
  
  async setCachedStateContent(state, stateAbbr, content) {
    try {
      const cacheKey = `state_content_${state}_${this.CACHE_VERSION}`
      const cacheData = {
        content: {
          ...content,
          content_generated_at: new Date().toISOString()
        },
        timestamp: Date.now()
      }
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      console.log(`Cached content for ${state}`)
    } catch (error) {
      console.error('Cache storage error:', error)
    }
  }
  
  // Get generation statistics  
  async getStats() {
    const states = Object.keys(localStorage)
      .filter(key => key.startsWith('state_content_'))
      .map(key => key.replace('state_content_', ''))
    
    return {
      cachedStates: states.length,
      states: states
    }
  }
  
  // Developer utility: Clear all state content cache
  static clearAllStateCache() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('state_content_'))
    keys.forEach(key => localStorage.removeItem(key))
    console.log(`Cleared ${keys.length} state content cache entries:`, keys)
    return keys.length
  }
  
  // Developer utility: Clear specific state cache
  static clearStateCache(state) {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(`state_content_${state}`))
    keys.forEach(key => localStorage.removeItem(key))
    console.log(`Cleared ${keys.length} cache entries for ${state}:`, keys)
    return keys.length
  }
}

// Make cache utilities available in browser console for debugging
if (typeof window !== 'undefined') {
  window.StateContentGenerator = StateContentGenerator
  
  // Global premarital object for easy console access
  window.premarital = {
    clearStateCache: StateContentGenerator.clearStateCache,
    clearAllStateCaches: StateContentGenerator.clearAllStateCache,
    listCachedStates: () => {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('state_content_'))
      console.log(`Found ${keys.length} cached state entries:`, keys)
      return keys
    }
  }
}

export default StateContentGenerator
