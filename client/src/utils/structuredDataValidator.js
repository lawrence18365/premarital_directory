// JSON-LD Structured Data Testing and Validation Utilities

/**
 * Validates JSON-LD structured data against basic schema requirements
 */
export const validateStructuredData = (data) => {
  const errors = []
  const warnings = []

  if (!data) {
    errors.push('No structured data provided')
    return { isValid: false, errors, warnings }
  }

  // Check required @context
  if (!data['@context']) {
    errors.push('Missing required @context property')
  } else if (data['@context'] !== 'https://schema.org') {
    warnings.push('@context should be https://schema.org for optimal compatibility')
  }

  // Check required @type
  if (!data['@type']) {
    errors.push('Missing required @type property')
  }

  // Validate specific schema types
  switch (data['@type']) {
    case 'Person':
    case 'ProfessionalService':
      validatePersonSchema(data, errors, warnings)
      break
    case 'WebSite':
      validateWebSiteSchema(data, errors, warnings)
      break
    case 'LocalBusiness':
      validateLocalBusinessSchema(data, errors, warnings)
      break
    case 'BreadcrumbList':
      validateBreadcrumbSchema(data, errors, warnings)
      break
    case 'FAQPage':
      validateFAQSchema(data, errors, warnings)
      break
    case 'Article':
    case 'BlogPosting':
      validateArticleSchema(data, errors, warnings)
      break
    default:
      warnings.push(`Schema type ${data['@type']} validation not implemented`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    schemaType: data['@type']
  }
}

/**
 * Validate Person/Professional schema
 */
const validatePersonSchema = (data, errors, warnings) => {
  if (!data.name) {
    errors.push('Person schema missing required "name" property')
  }
  
  if (data.address && !data.address['@type']) {
    warnings.push('Address should have @type: "PostalAddress"')
  }
  
  if (data.telephone && !/^[+]?[\d\s\-()]+$/.test(data.telephone)) {
    warnings.push('Telephone format may not be optimal for structured data')
  }
}

/**
 * Validate WebSite schema
 */
const validateWebSiteSchema = (data, errors, warnings) => {
  if (!data.name) {
    errors.push('WebSite schema missing required "name" property')
  }
  
  if (!data.url) {
    errors.push('WebSite schema missing required "url" property')
  }
  
  if (data.potentialAction && data.potentialAction['@type'] === 'SearchAction') {
    if (!data.potentialAction.target) {
      errors.push('SearchAction missing required "target" property')
    }
    if (!data.potentialAction['query-input']) {
      errors.push('SearchAction missing required "query-input" property')
    }
  }
}

/**
 * Validate LocalBusiness schema
 */
const validateLocalBusinessSchema = (data, errors, warnings) => {
  if (!data.name) {
    errors.push('LocalBusiness schema missing required "name" property')
  }
  
  if (!data.address) {
    warnings.push('LocalBusiness should include address information')
  }
  
  if (data.telephone && !data.telephone.startsWith('+')) {
    warnings.push('International phone format (+1-xxx-xxx-xxxx) recommended')
  }
}

/**
 * Validate BreadcrumbList schema
 */
const validateBreadcrumbSchema = (data, errors, warnings) => {
  if (!data.itemListElement || !Array.isArray(data.itemListElement)) {
    errors.push('BreadcrumbList missing required "itemListElement" array')
    return
  }
  
  data.itemListElement.forEach((item, index) => {
    if (!item.position) {
      errors.push(`Breadcrumb item ${index} missing "position" property`)
    }
    if (!item.name) {
      errors.push(`Breadcrumb item ${index} missing "name" property`)
    }
    if (!item.item && index < data.itemListElement.length - 1) {
      warnings.push(`Breadcrumb item ${index} missing "item" property (URL)`)
    }
  })
}

/**
 * Validate FAQ schema
 */
const validateFAQSchema = (data, errors, warnings) => {
  if (!data.mainEntity || !Array.isArray(data.mainEntity)) {
    errors.push('FAQPage missing required "mainEntity" array')
    return
  }
  
  data.mainEntity.forEach((question, index) => {
    if (question['@type'] !== 'Question') {
      errors.push(`FAQ item ${index} should have @type: "Question"`)
    }
    if (!question.name) {
      errors.push(`FAQ question ${index} missing "name" property`)
    }
    if (!question.acceptedAnswer) {
      errors.push(`FAQ question ${index} missing "acceptedAnswer" property`)
    } else if (question.acceptedAnswer['@type'] !== 'Answer') {
      errors.push(`FAQ question ${index} acceptedAnswer should have @type: "Answer"`)
    } else if (!question.acceptedAnswer.text) {
      errors.push(`FAQ question ${index} acceptedAnswer missing "text" property`)
    }
  })
}

/**
 * Validate Article schema
 */
const validateArticleSchema = (data, errors, warnings) => {
  if (!data.headline) {
    errors.push('Article schema missing required "headline" property')
  }
  
  if (!data.author) {
    warnings.push('Article should include author information')
  }
  
  if (!data.datePublished) {
    warnings.push('Article should include datePublished')
  }
  
  if (!data.publisher) {
    warnings.push('Article should include publisher information')
  }
}

/**
 * Test all structured data on current page
 */
export const testPageStructuredData = () => {
  const results = []
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  
  scripts.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent)
      const validation = validateStructuredData(data)
      results.push({
        index,
        data,
        validation,
        element: script
      })
    } catch (error) {
      results.push({
        index,
        validation: {
          isValid: false,
          errors: [`Invalid JSON: ${error.message}`],
          warnings: [],
          schemaType: 'unknown'
        },
        element: script
      })
    }
  })
  
  return results
}

/**
 * Generate structured data test report
 */
export const generateStructuredDataReport = () => {
  const results = testPageStructuredData()
  const report = {
    totalSchemas: results.length,
    validSchemas: results.filter(r => r.validation.isValid).length,
    errors: results.reduce((acc, r) => acc + r.validation.errors.length, 0),
    warnings: results.reduce((acc, r) => acc + r.validation.warnings.length, 0),
    schemaTypes: [...new Set(results.map(r => r.validation.schemaType))],
    details: results
  }
  
  return report
}

/**
 * Console logging utility for development
 */
export const logStructuredDataReport = () => {
  if (process.env.NODE_ENV !== 'development') return
  
  const report = generateStructuredDataReport()
  
  console.group('Structured Data Validation Report')
  console.log(`Total schemas found: ${report.totalSchemas}`)
  console.log(`Valid schemas: ${report.validSchemas}/${report.totalSchemas}`)
  console.log(`Total errors: ${report.errors}`)
  console.log(`Total warnings: ${report.warnings}`)
  console.log(`Schema types: ${report.schemaTypes.join(', ')}`)
  
  report.details.forEach((result, index) => {
    const { validation } = result
    console.group(`Schema ${index + 1}: ${validation.schemaType}`)
    
    if (validation.errors.length > 0) {
      console.error('Errors:', validation.errors)
    }
    
    if (validation.warnings.length > 0) {
      console.warn('Warnings:', validation.warnings)
    }
    
    if (validation.isValid) {
      console.log('Valid')
    } else {
      console.log('Invalid')
    }
    
    console.groupEnd()
  })
  
  console.groupEnd()
}

/**
 * Development helper to run tests on page load
 */
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    window.testStructuredData = testPageStructuredData
    window.logStructuredDataReport = logStructuredDataReport
    
    // Auto-run tests after page load
    window.addEventListener('load', () => {
      setTimeout(logStructuredDataReport, 1000)
    })
  }
}
