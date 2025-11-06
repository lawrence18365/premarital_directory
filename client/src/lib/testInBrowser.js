// Browser-based test for the AI content generation system
import CityContentGenerator from './cityContentGenerator'
import CityContentCache from './cityContentCache'

// Test function to be called from browser console
export async function testAISystem() {
  console.log('🤖 Testing AI System in Browser...')
  
  try {
    // Test 1: Cache functionality
    console.log('\n1. Testing Cache...')
    
    const testData = {
      state: 'test-browser',
      city: 'test-city',
      state_abbr: 'TB',
      title: 'Test Title',
      description: 'Test Description',
      h1_content: 'Test H1',
      intro_paragraph: 'Test intro',
      marriage_statistics: { avgAge: 28 },
      local_venues: [{ name: 'Test Venue' }],
      pricing_insights: { sessionCost: '$150' },
      legal_requirements: 'Test requirements',
      nearby_cities: ['City1', 'City2'],
      demographics: { population: 50000 }
    }
    
    await CityContentCache.setCachedContent('test-browser', 'test-city', 'TB', testData)
    const cached = await CityContentCache.getCachedContent('test-browser', 'test-city')
    
    if (cached) {
      console.log('✅ Cache working!')
    } else {
      console.log('❌ Cache failed')
      return false
    }
    
    // Test 2: AI Content Generation
    console.log('\n2. Testing AI Generation...')
    
    const contentGenerator = new CityContentGenerator()
    const content = await contentGenerator.getOrGenerateCityContent(
      'alaska',
      'Anchorage',
      { forceRegenerate: true, isBot: true }
    )
    
    if (content && content.title) {
      console.log('✅ AI Generation working!')
      console.log('Title:', content.title)
      console.log('Has sections:', !!content.sections)
      console.log('Provider:', content.provider)
    } else {
      console.log('❌ AI Generation failed')
      return false
    }
    
    // Cleanup test data
    console.log('\n3. Cleanup...')
    // Note: Would need delete method in cache class
    
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('✨ System ready for production!')
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Test bot detection
export function testBotDetection() {
  const userAgents = [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'facebookexternalhit/1.1'
  ]
  
  console.log('🤖 Testing Bot Detection...')
  
  userAgents.forEach(ua => {
    const isBot = CityContentGenerator.detectBot(ua)
    const agentName = ua.includes('Googlebot') ? 'Googlebot' : 
                     ua.includes('bingbot') ? 'Bingbot' :
                     ua.includes('facebook') ? 'Facebook' : 'Regular Browser'
    
    console.log(`${isBot ? '🤖' : '👤'} ${agentName}: ${isBot ? 'BOT' : 'HUMAN'}`)
  })
}

// Make functions available globally in browser
if (typeof window !== 'undefined') {
  window.testAISystem = testAISystem
  window.testBotDetection = testBotDetection
  
  console.log('🔧 Test functions loaded! Available commands:')
  console.log('   testAISystem() - Test complete AI system')
  console.log('   testBotDetection() - Test bot detection logic')
}