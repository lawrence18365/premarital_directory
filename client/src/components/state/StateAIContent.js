import React from 'react'

const Section = ({ title, children }) => (
  <section className="ai-card">
    {title && <h3 className="ai-card-title">{title}</h3>}
    <div className="ai-card-body">{children}</div>
  </section>
)

const List = ({ items }) => {
  if (!items || !Array.isArray(items) || items.length === 0) return null
  return (
    <ul className="ai-list">
      {items.map((it, idx) => (
        <li key={idx}>{it}</li>
      ))}
    </ul>
  )
}

const KeyValue = ({ data }) => {
  if (!data) return null
  const entries = Object.entries(data).filter(([k, v]) => v !== undefined && v !== null && v !== '')
  if (entries.length === 0) return null
  return (
    <dl className="ai-kv">
      {entries.map(([k, v]) => (
        <div className="ai-kv-row" key={k}>
          <dt>{humanize(k)}</dt>
          <dd>{String(v)}</dd>
        </div>
      ))}
    </dl>
  )
}

function humanize(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
}

const StateAIContent = ({ stateName, content, loading }) => {
  if (loading) {
    return (
      <div className="ai-loading">
        <div className="ai-spinner" />
        <p>Preparing insights for {stateName}…</p>
      </div>
    )
  }

  if (!content) return null

  const { sections = {}, intro } = content

  return (
    <div className="state-ai-section">
      {/* Data Source Indicator */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {content.dataSource || 'AI-generated content'}
            </p>
            <p className="text-xs text-gray-500">
              Generated: {content.generated ? new Date(content.generated).toLocaleString() : 'Unknown'}
            </p>
          </div>
          {content.sources && content.sources.length > 0 && (
            <div className="text-green-600">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Real web data
              </span>
            </div>
          )}
        </div>
      </div>

      {intro && (
        <p className="ai-intro">{intro}</p>
      )}
      <div className="ai-grid">
        {sections.overview && (
          <Section title={`Why Premarital Counseling in ${stateName}`}> 
            {sections.overview.benefits && <p>{sections.overview.benefits}</p>}
            {sections.overview.uniqueAspects && <p className="ai-subtle">{sections.overview.uniqueAspects}</p>}
          </Section>
        )}

        {sections.counselingResources && (
          <Section title="Counseling Resources">
            {Array.isArray(sections.counselingResources.types) ? (
              <List items={sections.counselingResources.types} />
            ) : (
              sections.counselingResources.types && <p>{sections.counselingResources.types}</p>
            )}
            {sections.counselingResources.religious && (
              <p><strong>Religious:</strong> {sections.counselingResources.religious}</p>
            )}
            {sections.counselingResources.secular && (
              <p><strong>Secular:</strong> {sections.counselingResources.secular}</p>
            )}
          </Section>
        )}

        {sections.marriageStats && (
          <Section title="Marriage Statistics">
            <KeyValue data={{
              'Trends': sections.marriageStats.trends,
              'Average marriage age': sections.marriageStats.avgMarriageAge,
              'Annual marriages': sections.marriageStats.annualMarriages,
              'Divorce rate': sections.marriageStats.divorceRate
            }} />
          </Section>
        )}

        {sections.legalRequirements && (
          <Section title={`${stateName} Marriage Requirements`}>
            {sections.legalRequirements.process && <p>{sections.legalRequirements.process}</p>}
            <KeyValue data={{
              'Waiting period': sections.legalRequirements.waitingPeriod,
              'Fees': sections.legalRequirements.fees,
              'Identification': sections.legalRequirements.identification,
              'Blood test': sections.legalRequirements.bloodTest
            }} />
          </Section>
        )}

        {sections.demographics && (
          <Section title={`${stateName} Demographics`}>
            <KeyValue data={sections.demographics} />
          </Section>
        )}
      </div>

      {/* Sources / Citations */}
      <div className="mt-6">
        <h4 className="ai-card-title">Sources & Verification</h4>
        {Array.isArray(content.sources) && content.sources.length > 0 ? (
          <>
            <ul className="ai-list mb-3">
              {content.sources.map((s, idx) => (
                <li key={idx}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {s.title || s.url}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              <strong>Important:</strong> Verify with your county clerk; requirements can change.
            </p>
          </>
        ) : (
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
              No external sources cited
            </div>
            <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              <strong>Important:</strong> This content is AI-generated. Always verify marriage license requirements and fees with your county clerk, as they can vary and change.
            </p>
          </div>
        )}
      </div>

      {/* Show raw data for debugging when jinaDataUsed */}
      {content.jinaDataUsed && process.env.NODE_ENV === 'development' && (
        <details className="mt-6 p-4 bg-blue-50 rounded-lg">
          <summary className="cursor-pointer font-medium text-blue-900">
            Debug: View Jina AI Raw Data
          </summary>
          <pre className="mt-4 text-xs text-blue-800 overflow-auto max-h-96">
            {JSON.stringify(content, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

export default StateAIContent
