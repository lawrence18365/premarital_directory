// State and city configuration for SEO and routing
export const STATE_CONFIG = {
  'alabama': { name: 'Alabama', abbr: 'AL', major_cities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'] },
  'alaska': { name: 'Alaska', abbr: 'AK', major_cities: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka'] },
  'arizona': { name: 'Arizona', abbr: 'AZ', major_cities: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Tempe'] },
  'arkansas': { name: 'Arkansas', abbr: 'AR', major_cities: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale'] },
  'california': { name: 'California', abbr: 'CA', major_cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Oakland', 'Fresno', 'Long Beach'] },
  'colorado': { name: 'Colorado', abbr: 'CO', major_cities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton'] },
  'connecticut': { name: 'Connecticut', abbr: 'CT', major_cities: ['Hartford', 'Bridgeport', 'New Haven', 'Stamford', 'Waterbury'] },
  'delaware': { name: 'Delaware', abbr: 'DE', major_cities: ['Wilmington', 'Dover', 'Newark', 'Middletown'] },
  'florida': { name: 'Florida', abbr: 'FL', major_cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'Tallahassee', 'St. Petersburg'] },
  'georgia': { name: 'Georgia', abbr: 'GA', major_cities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens', 'Sandy Springs'] },
  'hawaii': { name: 'Hawaii', abbr: 'HI', major_cities: ['Honolulu', 'Hilo', 'Kailua', 'Kaneohe'] },
  'idaho': { name: 'Idaho', abbr: 'ID', major_cities: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello'] },
  'illinois': { name: 'Illinois', abbr: 'IL', major_cities: ['Chicago', 'Aurora', 'Peoria', 'Rockford', 'Joliet', 'Naperville'] },
  'indiana': { name: 'Indiana', abbr: 'IN', major_cities: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'] },
  'iowa': { name: 'Iowa', abbr: 'IA', major_cities: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City'] },
  'kansas': { name: 'Kansas', abbr: 'KS', major_cities: ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka'] },
  'kentucky': { name: 'Kentucky', abbr: 'KY', major_cities: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'] },
  'louisiana': { name: 'Louisiana', abbr: 'LA', major_cities: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'] },
  'maine': { name: 'Maine', abbr: 'ME', major_cities: ['Portland', 'Lewiston', 'Bangor', 'South Portland'] },
  'maryland': { name: 'Maryland', abbr: 'MD', major_cities: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Annapolis'] },
  'massachusetts': { name: 'Massachusetts', abbr: 'MA', major_cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'] },
  'michigan': { name: 'Michigan', abbr: 'MI', major_cities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor'] },
  'minnesota': { name: 'Minnesota', abbr: 'MN', major_cities: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth', 'Plymouth'] },
  'mississippi': { name: 'Mississippi', abbr: 'MS', major_cities: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg'] },
  'missouri': { name: 'Missouri', abbr: 'MO', major_cities: ['Kansas City', 'Saint Louis', 'Springfield', 'Columbia', 'Independence'] },
  'montana': { name: 'Montana', abbr: 'MT', major_cities: ['Billings', 'Missoula', 'Great Falls', 'Bozeman'] },
  'nebraska': { name: 'Nebraska', abbr: 'NE', major_cities: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'] },
  'nevada': { name: 'Nevada', abbr: 'NV', major_cities: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'] },
  'new-hampshire': { name: 'New Hampshire', abbr: 'NH', major_cities: ['Manchester', 'Nashua', 'Concord', 'Derry'] },
  'new-jersey': { name: 'New Jersey', abbr: 'NJ', major_cities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison'] },
  'new-mexico': { name: 'New Mexico', abbr: 'NM', major_cities: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe'] },
  'new-york': { name: 'New York', abbr: 'NY', major_cities: ['New York', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany'] },
  'north-carolina': { name: 'North Carolina', abbr: 'NC', major_cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'] },
  'north-dakota': { name: 'North Dakota', abbr: 'ND', major_cities: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'] },
  'ohio': { name: 'Ohio', abbr: 'OH', major_cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'] },
  'oklahoma': { name: 'Oklahoma', abbr: 'OK', major_cities: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'] },
  'oregon': { name: 'Oregon', abbr: 'OR', major_cities: ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro'] },
  'pennsylvania': { name: 'Pennsylvania', abbr: 'PA', major_cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'] },
  'rhode-island': { name: 'Rhode Island', abbr: 'RI', major_cities: ['Providence', 'Warwick', 'Cranston', 'Pawtucket'] },
  'south-carolina': { name: 'South Carolina', abbr: 'SC', major_cities: ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant'] },
  'south-dakota': { name: 'South Dakota', abbr: 'SD', major_cities: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings'] },
  'tennessee': { name: 'Tennessee', abbr: 'TN', major_cities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'] },
  'texas': { name: 'Texas', abbr: 'TX', major_cities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi'] },
  'utah': { name: 'Utah', abbr: 'UT', major_cities: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'] },
  'vermont': { name: 'Vermont', abbr: 'VT', major_cities: ['Burlington', 'South Burlington', 'Rutland', 'Barre'] },
  'virginia': { name: 'Virginia', abbr: 'VA', major_cities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News'] },
  'washington': { name: 'Washington', abbr: 'WA', major_cities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'] },
  'washington-dc': { name: 'Washington, DC', abbr: 'DC', major_cities: ['Capitol Hill', 'Georgetown', 'Dupont Circle', 'Adams Morgan'] },
  'west-virginia': { name: 'West Virginia', abbr: 'WV', major_cities: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg'] },
  'wisconsin': { name: 'Wisconsin', abbr: 'WI', major_cities: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'] },
  'wyoming': { name: 'Wyoming', abbr: 'WY', major_cities: ['Cheyenne', 'Casper', 'Laramie', 'Gillette'] }
}

// Extended city configurations with additional SEO data
// is_anchor: true means this is a priority city for SEO focus
export const CITY_CONFIG = {
  'texas': {
    'austin': {
      name: 'Austin',
      population: '978,908',
      description: 'Austin, the vibrant capital of Texas, offers excellent premarital counseling services.',
      specialties: ['LGBTQ+ friendly counseling', 'Tech industry professionals', 'University counseling'],
      is_anchor: true
    },
    'dallas': {
      name: 'Dallas',
      population: '1,304,379',
      description: 'Dallas provides comprehensive marriage preparation services for couples.',
      specialties: ['Business professional counseling', 'Multicultural counseling', 'Financial planning focus'],
      is_anchor: true
    },
    'houston': {
      name: 'Houston',
      population: '2,304,580',
      description: 'Houston\'s diverse counseling community serves couples from all backgrounds.',
      specialties: ['International couples', 'Medical professional counseling', 'Bilingual services'],
      is_anchor: true
    },
    'san-antonio': {
      name: 'San Antonio',
      population: '1,434,625',
      description: 'San Antonio offers culturally rich premarital counseling experiences.',
      specialties: ['Hispanic/Latino counseling', 'Military couples', 'Traditional values focus']
    }
  },
  'california': {
    'los-angeles': {
      name: 'Los Angeles',
      population: '3,898,747',
      description: 'LA provides world-class premarital counseling in multiple languages.',
      specialties: ['Entertainment industry professionals', 'Multicultural counseling', 'LGBTQ+ affirming'],
      is_anchor: true
    },
    'san-francisco': {
      name: 'San Francisco',
      population: '873,965',
      description: 'San Francisco offers progressive and inclusive marriage preparation services.',
      specialties: ['Tech professionals', 'LGBTQ+ specialized', 'High-net-worth counseling'],
      is_anchor: true
    },
    'san-diego': {
      name: 'San Diego',
      population: '1,386,932',
      description: 'San Diego combines beach-town relaxation with professional counseling excellence.',
      specialties: ['Military couples', 'Outdoor therapy options', 'Cross-border relationships']
    }
  },
  'new-york': {
    'new-york': {
      name: 'New York City',
      population: '8,336,817',
      description: 'NYC offers the most diverse selection of premarital counseling professionals.',
      specialties: ['Financial district professionals', 'International couples', 'All cultural backgrounds'],
      is_anchor: true
    },
    'buffalo': {
      name: 'Buffalo',
      population: '278,349',
      description: 'Buffalo provides warm, community-focused premarital counseling services.',
      specialties: ['Blue-collar professionals', 'Traditional counseling', 'Family-centered approach']
    }
  },
  'florida': {
    'miami': {
      name: 'Miami',
      population: '442,241',
      description: 'Miami offers bilingual and culturally diverse premarital counseling.',
      specialties: ['Latin American couples', 'Bilingual counseling', 'International relationships'],
      is_anchor: true
    },
    'orlando': {
      name: 'Orlando',
      population: '307,573',
      description: 'Orlando provides family-friendly premarital counseling services.',
      specialties: ['Tourism industry professionals', 'Theme park workers', 'Young families']
    }
  },
  'illinois': {
    'chicago': {
      name: 'Chicago',
      population: '2,746,388',
      description: 'Chicago offers a rich tradition of marriage preparation services across diverse communities.',
      specialties: ['Urban professionals', 'Diverse religious traditions', 'Multicultural counseling'],
      is_anchor: true
    }
  },
  'georgia': {
    'atlanta': {
      name: 'Atlanta',
      population: '498,715',
      description: 'Atlanta provides southern hospitality with modern premarital counseling approaches.',
      specialties: ['African American counseling', 'Business professionals', 'Faith-based counseling'],
      is_anchor: true
    }
  },
  'colorado': {
    'denver': {
      name: 'Denver',
      population: '715,522',
      description: 'Denver combines outdoor lifestyle with holistic marriage preparation services.',
      specialties: ['Active lifestyle couples', 'Holistic approaches', 'Young professionals'],
      is_anchor: true
    }
  }
}

// Generate all city routes for a state
export const generateCityRoutes = (stateSlug) => {
  const state = STATE_CONFIG[stateSlug]
  if (!state) return []
  
  return state.major_cities.map(cityName => ({
    citySlug: cityName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, ''),
    cityName,
    stateName: state.name,
    stateAbbr: state.abbr
  }))
}

// Get all possible city routes for sitemap generation
export const getAllCityRoutes = () => {
  const routes = []
  
  Object.keys(STATE_CONFIG).forEach(stateSlug => {
    const cityRoutes = generateCityRoutes(stateSlug)
    cityRoutes.forEach(city => {
      routes.push({
        url: `/professionals/${stateSlug}/${city.citySlug}`,
        ...city,
        stateSlug
      })
    })
  })
  
  return routes
}

// Search functionality
export const searchCities = (query, limit = 10) => {
  const routes = getAllCityRoutes()
  const searchTerm = query.toLowerCase()

  return routes
    .filter(route =>
      route.cityName.toLowerCase().includes(searchTerm) ||
      route.stateName.toLowerCase().includes(searchTerm)
    )
    .slice(0, limit)
}

// Get all anchor cities for priority SEO focus
export const getAnchorCities = () => {
  const anchorCities = []

  Object.entries(CITY_CONFIG).forEach(([stateSlug, cities]) => {
    Object.entries(cities).forEach(([citySlug, cityData]) => {
      if (cityData.is_anchor) {
        const stateData = STATE_CONFIG[stateSlug]
        anchorCities.push({
          citySlug,
          cityName: cityData.name,
          stateSlug,
          stateName: stateData?.name || stateSlug,
          stateAbbr: stateData?.abbr || '',
          population: cityData.population,
          description: cityData.description,
          specialties: cityData.specialties,
          url: `/premarital-counseling/${stateSlug}/${citySlug}`
        })
      }
    })
  })

  return anchorCities
}

// Check if a city is an anchor city
export const isAnchorCity = (stateSlug, citySlug) => {
  const cityConfig = CITY_CONFIG[stateSlug]?.[citySlug]
  return cityConfig?.is_anchor === true
}