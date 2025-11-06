// Core Web Vitals Monitoring and Reporting

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

/**
 * Web Vitals configuration and thresholds
 */
const WEB_VITALS_CONFIG = {
  // Google's recommended thresholds
  thresholds: {
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FID: { good: 100, needsImprovement: 300 },
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    TTFB: { good: 800, needsImprovement: 1800 }
  },
  // Enable detailed logging in development
  enableLogging: process.env.NODE_ENV === 'development',
  // Send to analytics in production
  enableAnalytics: process.env.NODE_ENV === 'production'
}

/**
 * Determine performance rating based on thresholds
 */
const getPerformanceRating = (name, value) => {
  const threshold = WEB_VITALS_CONFIG.thresholds[name]
  if (!threshold) return 'unknown'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

/**
 * Format metric value for display
 */
const formatMetricValue = (name, value) => {
  switch (name) {
    case 'CLS':
      return value.toFixed(3)
    case 'FID':
    case 'FCP':
    case 'LCP':
    case 'TTFB':
      return `${Math.round(value)}ms`
    default:
      return value.toString()
  }
}

/**
 * Send metric to Google Analytics 4
 */
const sendToGA4 = (metric) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      custom_parameter_1: metric.rating,
      custom_parameter_2: metric.id,
      non_interaction: true
    })
  }
}

/**
 * Send metric to Facebook Pixel (if available)
 */
const sendToFacebookPixel = (metric) => {
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', 'WebVitals', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      page: window.location.pathname
    })
  }
}

/**
 * Log metric to console in development
 */
const logToConsole = (metric) => {
  const rating = getPerformanceRating(metric.name, metric.value)
  const formattedValue = formatMetricValue(metric.name, metric.value)
  
  const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌'
  
  console.log(
    `${emoji} ${metric.name}: ${formattedValue} (${rating})`,
    {
      value: metric.value,
      rating,
      id: metric.id,
      delta: metric.delta,
      entries: metric.entries
    }
  )
}

/**
 * Store metrics for local analysis
 */
let webVitalsData = []

const storeMetric = (metric) => {
  const enhancedMetric = {
    ...metric,
    rating: getPerformanceRating(metric.name, metric.value),
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : null
  }
  
  webVitalsData.push(enhancedMetric)
  
  // Keep only last 50 metrics
  if (webVitalsData.length > 50) {
    webVitalsData = webVitalsData.slice(-50)
  }
  
  return enhancedMetric
}

/**
 * Generic metric handler
 */
const handleMetric = (metric) => {
  const enhancedMetric = storeMetric(metric)
  
  if (WEB_VITALS_CONFIG.enableLogging) {
    logToConsole(enhancedMetric)
  }
  
  if (WEB_VITALS_CONFIG.enableAnalytics) {
    sendToGA4(enhancedMetric)
    sendToFacebookPixel(enhancedMetric)
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export const initWebVitalsMonitoring = () => {
  try {
    getCLS(handleMetric)
    getFID(handleMetric)
    getFCP(handleMetric)
    getLCP(handleMetric)
    getTTFB(handleMetric)
    
    if (WEB_VITALS_CONFIG.enableLogging) {
      console.log('🚀 Web Vitals monitoring initialized')
    }
  } catch (error) {
    console.error('Failed to initialize Web Vitals monitoring:', error)
  }
}

/**
 * Get current Web Vitals data
 */
export const getWebVitalsData = () => {
  return [...webVitalsData]
}

/**
 * Get Web Vitals summary
 */
export const getWebVitalsSummary = () => {
  if (webVitalsData.length === 0) {
    return { message: 'No Web Vitals data collected yet' }
  }
  
  const latestMetrics = {}
  webVitalsData.forEach(metric => {
    latestMetrics[metric.name] = metric
  })
  
  const summary = {
    metrics: latestMetrics,
    overall: {
      good: 0,
      needsImprovement: 0,
      poor: 0
    },
    recommendations: []
  }
  
  // Calculate overall score
  Object.values(latestMetrics).forEach(metric => {
    summary.overall[metric.rating.replace('-', '')]++
  })
  
  // Generate recommendations
  Object.entries(latestMetrics).forEach(([name, metric]) => {
    if (metric.rating === 'poor') {
      summary.recommendations.push(getRecommendation(name, metric))
    }
  })
  
  return summary
}

/**
 * Get performance recommendations
 */
const getRecommendation = (metricName, metric) => {
  const recommendations = {
    CLS: {
      title: 'Improve Cumulative Layout Shift',
      suggestions: [
        'Add size attributes to images and video elements',
        'Ensure ads elements have reserved space',
        'Avoid inserting content above existing content',
        'Use CSS aspect-ratio or size containers'
      ]
    },
    FID: {
      title: 'Improve First Input Delay',
      suggestions: [
        'Reduce JavaScript execution time',
        'Remove unused JavaScript code',
        'Split long JavaScript tasks',
        'Use a web worker for heavy computations'
      ]
    },
    LCP: {
      title: 'Improve Largest Contentful Paint',
      suggestions: [
        'Optimize and compress images',
        'Preload key resources',
        'Reduce server response time',
        'Remove render-blocking resources'
      ]
    },
    FCP: {
      title: 'Improve First Contentful Paint',
      suggestions: [
        'Reduce server response time',
        'Eliminate render-blocking resources',
        'Minify CSS and JavaScript',
        'Use a CDN'
      ]
    },
    TTFB: {
      title: 'Improve Time to First Byte',
      suggestions: [
        'Optimize server configuration',
        'Use a CDN',
        'Cache resources properly',
        'Minimize server processing time'
      ]
    }
  }
  
  return {
    metric: metricName,
    value: formatMetricValue(metricName, metric.value),
    ...recommendations[metricName]
  }
}

/**
 * Export Web Vitals data as JSON
 */
export const exportWebVitalsData = () => {
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    metrics: getWebVitalsData(),
    summary: getWebVitalsSummary()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `web-vitals-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Development tools for Web Vitals
 */
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.getWebVitalsData = getWebVitalsData
  window.getWebVitalsSummary = getWebVitalsSummary
  window.exportWebVitalsData = exportWebVitalsData
  
  // Show Web Vitals button in development
  window.addEventListener('load', () => {
    setTimeout(() => {
      const button = document.createElement('button')
      button.textContent = '📊 Web Vitals'
      button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: #2563eb;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `
      button.onclick = () => {
        console.table(getWebVitalsSummary().metrics)
      }
      document.body.appendChild(button)
    }, 2000)
  })
}

// Auto-initialize on import
initWebVitalsMonitoring()