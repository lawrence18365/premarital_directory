// AI Content Generator using Supabase Edge Function (secure)
// Cost: FREE using DeepSeek R1 model

class AIContentGenerator {
  constructor() {
    // Use Supabase Edge Function instead of direct API calls for security
    this.functionURL = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/generate-city-content`
    this.maxRetries = 3
  }
  
  async generateCityContent(cityData) {
    const { city, state, stateAbbr, demographicData, venueData } = cityData
    
    try {
      const response = await this.callSupabaseFunction(cityData)
      return response
    } catch (error) {
      console.error('AI content generation failed:', error)
      throw error
    }
  }
  
  async callSupabaseFunction(cityData, retryCount = 0) {
    try {
      const response = await fetch(this.functionURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(cityData)
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Supabase Function error: ${response.status} - ${error}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(`Function error: ${data.error}`)
      }
      
      return data
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.warn(`Retry ${retryCount + 1}/${this.maxRetries} for AI generation:`, error.message)
        await this.delay(1000 * (retryCount + 1)) // Exponential backoff
        return this.callSupabaseFunction(cityData, retryCount + 1)
      }
      throw error
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // Estimate cost for a generation request
  estimateCost(prompt) {
    const estimatedTokens = Math.ceil(prompt.length / 4) + 2000 // Input + output
    const costPerToken = 0 // FREE model!
    return estimatedTokens * costPerToken
  }
}

export default AIContentGenerator