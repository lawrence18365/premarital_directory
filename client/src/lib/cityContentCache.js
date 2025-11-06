import { supabase } from './supabaseClient'

export class CityContentCache {
  
  // Get cached content for a city
  static async getCachedContent(state, city) {
    try {
      const { data, error } = await supabase
        .from('city_content_cache')
        .select('*')
        .eq('state', state.toLowerCase())
        .eq('city', city.toLowerCase())
        .eq('is_active', true)
        .gt('cache_expires_at', new Date().toISOString())
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      return data
    } catch (error) {
      console.error('Error getting cached content:', error)
      return null
    }
  }
  
  // Cache generated content
  static async setCachedContent(state, city, stateAbbr, content) {
    try {
      // Set cache to expire in 30 days
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      
      const { data, error } = await supabase
        .from('city_content_cache')
        .upsert({
          state: state.toLowerCase(),
          city: city.toLowerCase(),
          state_abbr: stateAbbr.toUpperCase(),
          cache_expires_at: expiresAt.toISOString(),
          last_updated: new Date().toISOString(),
          is_active: true,
          ...content
        }, {
          onConflict: 'state,city'
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error caching content:', error)
      throw error
    }
  }
  
  // Check if content needs refresh
  static async needsRefresh(state, city) {
    const cached = await this.getCachedContent(state, city)
    return !cached
  }
  
  // Get cache statistics
  static async getCacheStats() {
    try {
      const { data, error } = await supabase
        .from('city_content_cache')
        .select('api_provider, generation_cost_tokens, content_generated_at')
        .eq('is_active', true)
      
      if (error) throw error
      
      const totalTokens = data.reduce((sum, item) => sum + (item.generation_cost_tokens || 0), 0)
      const totalPages = data.length
      const providers = [...new Set(data.map(item => item.api_provider))]
      
      return {
        totalPages,
        totalTokens,
        providers,
        avgTokensPerPage: totalTokens / totalPages || 0
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return null
    }
  }
}

export default CityContentCache