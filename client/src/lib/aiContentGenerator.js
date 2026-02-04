// AI Content Generator using Supabase Edge Function (secure)
// Cost: FREE using Google Gemini 2.0 Flash model

import { supabase } from './supabaseClient'

class AIContentGenerator {
  constructor() {
    // Use Supabase Edge Function instead of direct API calls for security
    this.maxRetries = 3
  }

  async generateCityContent(cityData) {
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
      const { data, error } = await supabase.functions.invoke('generate-city-content', {
        body: cityData
      })

      if (error) {
        throw new Error(error.message || 'Supabase Function error')
      }

      if (data?.error) {
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
