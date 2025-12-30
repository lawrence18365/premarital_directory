import CityContentGenerator from './cityContentGenerator'

// Test function to check AI content generation
export async function testCityContentGeneration() {
  console.log('Testing AI Content Generation System...')
  
  const contentGenerator = new CityContentGenerator()
  
  try {
    console.log('Testing: Anchorage, Alaska')
    
    // Force generation (simulating bot)
    const content = await contentGenerator.getOrGenerateCityContent(
      'alaska',
      'Anchorage',
      { 
        forceRegenerate: true,
        isBot: true
      }
    )
    
    console.log('Content generated successfully!')
    console.log('Title:', content.title)
    console.log('Description:', content.description?.substring(0, 100) + '...')
    console.log('Has AI sections:', !!content.sections)
    console.log('Provider:', content.provider)
    
    return content
    
  } catch (error) {
    console.error('Content generation failed:', error)
    throw error
  }
}

// Call this in browser console: window.testAI = testCityContentGeneration
if (typeof window !== 'undefined') {
  window.testAI = testCityContentGeneration
}
