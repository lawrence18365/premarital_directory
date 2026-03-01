// Regional premarital counseling cost data and research statistics
// Sources: Thumbtack 2025, CostHelper 2025, Journal of Family Psychology, HRF

// State-level cost ranges (per session) based on market research
// Higher-cost states reflect metro pricing; lower-cost states reflect rural/suburban averages
export const STATE_COST_DATA = {
  // High-cost states (major metros drive prices up)
  'california': { min: 150, max: 300, label: '$150–$300' },
  'new-york': { min: 150, max: 300, label: '$150–$300' },
  'massachusetts': { min: 150, max: 275, label: '$150–$275' },
  'connecticut': { min: 140, max: 250, label: '$140–$250' },
  'new-jersey': { min: 140, max: 250, label: '$140–$250' },
  'washington': { min: 130, max: 250, label: '$130–$250' },
  'hawaii': { min: 130, max: 250, label: '$130–$250' },
  'colorado': { min: 125, max: 225, label: '$125–$225' },
  'virginia': { min: 120, max: 225, label: '$120–$225' },
  'maryland': { min: 120, max: 225, label: '$120–$225' },
  'illinois': { min: 120, max: 225, label: '$120–$225' },
  'oregon': { min: 120, max: 220, label: '$120–$220' },
  'rhode-island': { min: 120, max: 220, label: '$120–$220' },
  'alaska': { min: 120, max: 225, label: '$120–$225' },
  'vermont': { min: 115, max: 200, label: '$115–$200' },
  'new-hampshire': { min: 115, max: 200, label: '$115–$200' },
  'delaware': { min: 110, max: 200, label: '$110–$200' },
  'pennsylvania': { min: 110, max: 200, label: '$110–$200' },
  'minnesota': { min: 110, max: 200, label: '$110–$200' },

  // Mid-cost states
  'arizona': { min: 100, max: 200, label: '$100–$200' },
  'florida': { min: 100, max: 200, label: '$100–$200' },
  'georgia': { min: 100, max: 190, label: '$100–$190' },
  'north-carolina': { min: 100, max: 190, label: '$100–$190' },
  'michigan': { min: 100, max: 185, label: '$100–$185' },
  'ohio': { min: 100, max: 185, label: '$100–$185' },
  'texas': { min: 100, max: 200, label: '$100–$200' },
  'nevada': { min: 100, max: 200, label: '$100–$200' },
  'wisconsin': { min: 100, max: 180, label: '$100–$180' },
  'iowa': { min: 90, max: 175, label: '$90–$175' },
  'utah': { min: 90, max: 175, label: '$90–$175' },
  'montana': { min: 90, max: 175, label: '$90–$175' },
  'south-carolina': { min: 90, max: 175, label: '$90–$175' },
  'missouri': { min: 90, max: 175, label: '$90–$175' },
  'nebraska': { min: 90, max: 170, label: '$90–$170' },
  'kansas': { min: 90, max: 170, label: '$90–$170' },
  'new-mexico': { min: 90, max: 175, label: '$90–$175' },
  'idaho': { min: 85, max: 170, label: '$85–$170' },
  'wyoming': { min: 85, max: 170, label: '$85–$170' },

  // Lower-cost states
  'tennessee': { min: 85, max: 175, label: '$85–$175' },
  'indiana': { min: 85, max: 170, label: '$85–$170' },
  'kentucky': { min: 80, max: 165, label: '$80–$165' },
  'alabama': { min: 80, max: 160, label: '$80–$160' },
  'louisiana': { min: 80, max: 165, label: '$80–$165' },
  'oklahoma': { min: 80, max: 160, label: '$80–$160' },
  'arkansas': { min: 75, max: 155, label: '$75–$155' },
  'mississippi': { min: 75, max: 150, label: '$75–$150' },
  'west-virginia': { min: 75, max: 150, label: '$75–$150' },
  'north-dakota': { min: 80, max: 160, label: '$80–$160' },
  'south-dakota': { min: 80, max: 160, label: '$80–$160' },
  'maine': { min: 100, max: 185, label: '$100–$185' },
  'washington-dc': { min: 150, max: 300, label: '$150–$300' },
}

// Default fallback for states not in the map
export const DEFAULT_COST = { min: 100, max: 200, label: '$100–$200' }

export function getStateCostRange(stateSlug) {
  return STATE_COST_DATA[stateSlug] || DEFAULT_COST
}

// Research-backed statistics for unique content
// These add E-E-A-T signals and differentiate pages from competitors
export const COUNSELING_STATS = {
  divorceReduction: '30%',
  divorceReductionSource: 'Journal of Family Psychology meta-analysis of 20 studies',
  participationRate: '44%',
  participationRateContext: 'of couples getting married today participate in premarital counseling',
  medianHours: 8,
  medianHoursContext: 'The median time couples spend in premarital counseling before their wedding',
  typicalSessions: '5–8',
  typicalSessionsContext: 'sessions over 2–3 months',
  marriageImportance: '93%',
  marriageImportanceContext: 'of Americans rate a happy marriage as one of the most important things in life',
  weddingCostContext: 'Premarital counseling costs 1–2% of the average wedding budget',
  churchCost: '$25–$125',
  churchCostContext: 'per session for church-affiliated counseling',
  privateCost: '$100–$250',
  privateCostContext: 'per session for licensed therapists in private practice',
  packageDeal: '$350–$900',
  packageDealContext: 'for a typical 4- to 8-session package',
  prepareEnrichCost: '$35',
  prepareEnrichCostContext: 'for the PREPARE/ENRICH assessment (separate from session fees)',
}

// Marriage license discount data by state (verified from state statutes)
export const LICENSE_DISCOUNT_DATA = {
  'florida': { discount: '$32.50', waitingPeriodWaiver: true, courseHours: 4, notes: 'Waives 3-day waiting period for FL residents' },
  'texas': { discount: '$60', waitingPeriodWaiver: true, courseHours: 8, notes: 'Twogether in Texas program; waives 72-hour waiting period' },
  'minnesota': { discount: 'Up to $75', waitingPeriodWaiver: false, courseHours: 12, notes: 'Requires minimum 12 hours of premarital education' },
  'tennessee': { discount: '$60', waitingPeriodWaiver: false, courseHours: 4, notes: 'Completion certificate required at application' },
  'oklahoma': { discount: '$50', waitingPeriodWaiver: false, courseHours: 4, notes: 'Must be completed within 1 year of application' },
  'georgia': { discount: '$15–$30', waitingPeriodWaiver: false, courseHours: 6, notes: 'County-dependent; some waive waiting period' },
  'indiana': { discount: '$60', waitingPeriodWaiver: true, courseHours: 4, notes: 'Waives mandatory waiting period' },
  'maryland': { discount: '$25', waitingPeriodWaiver: true, courseHours: 4, notes: 'Waives 48-hour waiting period' },
  'utah': { discount: '$20', waitingPeriodWaiver: false, courseHours: 4, notes: 'Premarital counseling or education course' },
}

export function getStateLicenseDiscount(stateSlug) {
  return LICENSE_DISCOUNT_DATA[stateSlug] || null
}
