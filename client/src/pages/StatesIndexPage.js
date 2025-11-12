import React from 'react'
import { Link } from 'react-router-dom'
import '../assets/css/states-page.css'

const STATES = [
  { slug: 'alabama', name: 'Alabama', abbr: 'AL' },
  { slug: 'alaska', name: 'Alaska', abbr: 'AK' },
  { slug: 'arizona', name: 'Arizona', abbr: 'AZ' },
  { slug: 'arkansas', name: 'Arkansas', abbr: 'AR' },
  { slug: 'california', name: 'California', abbr: 'CA' },
  { slug: 'colorado', name: 'Colorado', abbr: 'CO' },
  { slug: 'connecticut', name: 'Connecticut', abbr: 'CT' },
  { slug: 'delaware', name: 'Delaware', abbr: 'DE' },
  { slug: 'florida', name: 'Florida', abbr: 'FL' },
  { slug: 'georgia', name: 'Georgia', abbr: 'GA' },
  { slug: 'hawaii', name: 'Hawaii', abbr: 'HI' },
  { slug: 'idaho', name: 'Idaho', abbr: 'ID' },
  { slug: 'illinois', name: 'Illinois', abbr: 'IL' },
  { slug: 'indiana', name: 'Indiana', abbr: 'IN' },
  { slug: 'iowa', name: 'Iowa', abbr: 'IA' },
  { slug: 'kansas', name: 'Kansas', abbr: 'KS' },
  { slug: 'kentucky', name: 'Kentucky', abbr: 'KY' },
  { slug: 'louisiana', name: 'Louisiana', abbr: 'LA' },
  { slug: 'maine', name: 'Maine', abbr: 'ME' },
  { slug: 'maryland', name: 'Maryland', abbr: 'MD' },
  { slug: 'massachusetts', name: 'Massachusetts', abbr: 'MA' },
  { slug: 'michigan', name: 'Michigan', abbr: 'MI' },
  { slug: 'minnesota', name: 'Minnesota', abbr: 'MN' },
  { slug: 'mississippi', name: 'Mississippi', abbr: 'MS' },
  { slug: 'missouri', name: 'Missouri', abbr: 'MO' },
  { slug: 'montana', name: 'Montana', abbr: 'MT' },
  { slug: 'nebraska', name: 'Nebraska', abbr: 'NE' },
  { slug: 'nevada', name: 'Nevada', abbr: 'NV' },
  { slug: 'new-hampshire', name: 'New Hampshire', abbr: 'NH' },
  { slug: 'new-jersey', name: 'New Jersey', abbr: 'NJ' },
  { slug: 'new-mexico', name: 'New Mexico', abbr: 'NM' },
  { slug: 'new-york', name: 'New York', abbr: 'NY' },
  { slug: 'north-carolina', name: 'North Carolina', abbr: 'NC' },
  { slug: 'north-dakota', name: 'North Dakota', abbr: 'ND' },
  { slug: 'ohio', name: 'Ohio', abbr: 'OH' },
  { slug: 'oklahoma', name: 'Oklahoma', abbr: 'OK' },
  { slug: 'oregon', name: 'Oregon', abbr: 'OR' },
  { slug: 'pennsylvania', name: 'Pennsylvania', abbr: 'PA' },
  { slug: 'rhode-island', name: 'Rhode Island', abbr: 'RI' },
  { slug: 'south-carolina', name: 'South Carolina', abbr: 'SC' },
  { slug: 'south-dakota', name: 'South Dakota', abbr: 'SD' },
  { slug: 'tennessee', name: 'Tennessee', abbr: 'TN' },
  { slug: 'texas', name: 'Texas', abbr: 'TX' },
  { slug: 'utah', name: 'Utah', abbr: 'UT' },
  { slug: 'vermont', name: 'Vermont', abbr: 'VT' },
  { slug: 'virginia', name: 'Virginia', abbr: 'VA' },
  { slug: 'washington', name: 'Washington', abbr: 'WA' },
  { slug: 'west-virginia', name: 'West Virginia', abbr: 'WV' },
  { slug: 'wisconsin', name: 'Wisconsin', abbr: 'WI' },
  { slug: 'wyoming', name: 'Wyoming', abbr: 'WY' }
]

const StatesIndexPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="states-page-header">
        <div className="states-grid !pt-0">
          <div className="max-w-4xl">
            <nav className="text-sm text-gray-500 mb-4">
              <Link to="/" className="hover:text-blue-600">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">States</span>
            </nav>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Premarital Counselors by State
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              Find premarital counselors helping engaged couples prepare for marriage.
              Browse our directory of licensed professionals specializing in pre-marriage therapy and relationship preparation.
            </p>
          </div>
        </div>
      </div>

      {/* States Grid */}
      <div className="states-grid">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All 50 States + Washington DC
          </h2>
          <p className="text-gray-600">
            Select your state to find premarital counselors specializing in pre-marriage therapy in your area.
          </p>
        </div>

        <div className="state-grid">
          {STATES.map(state => (
            <Link
              key={state.slug}
              to={`/professionals/${state.slug}`}
              className="state-card"
            >
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {state.name}
                </h3>
                <p className="text-sm text-gray-500">{state.abbr}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* SEO Content */}
      <div className="seo-content-section">
        <div className="states-grid">
          <div className="content-grid">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Why Choose Premarital Counseling?
                </h2>
                
                <div className="space-y-4 text-gray-600">
                  <p>
                    Premarital counseling provides couples with essential tools and insights before marriage. 
                    Our network of licensed professionals across all 50 states helps couples build stronger relationships.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
                    Benefits of Premarital Counseling:
                  </h3>
                  <ul className="space-y-2">
                    <li>• Enhanced communication skills</li>
                    <li>• Conflict resolution strategies</li>
                    <li>• Financial planning discussions</li>
                    <li>• Family planning conversations</li>
                    <li>• Strengthened emotional intimacy</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  How Our Directory Works
                </h2>
                
                <div className="space-y-4 text-gray-600">
                  <p>
                    Our comprehensive directory makes it easy to find qualified premarital counselors 
                    in your state and city. All professionals are licensed and specialize in couples therapy.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
                    What You'll Find:
                  </h3>
                  <ul className="space-y-2">
                    <li>• Licensed therapists and counselors</li>
                    <li>• Marriage and family therapists (MFT)</li>
                    <li>• Faith-based counseling options</li>
                    <li>• Online and in-person sessions</li>
                    <li>• Verified professional profiles</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

export default StatesIndexPage
