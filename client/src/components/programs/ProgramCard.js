import React from 'react'

const formatDate = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const ProgramCard = ({ program }) => {
  if (!program) return null

  const languages = Array.isArray(program.languages) ? program.languages : []
  const requirementList = Array.isArray(program.requirementList) ? program.requirementList : []
  const location = [program.church?.city, program.church?.stateProvince].filter(Boolean).join(', ')
  const chips = [
    program.programType,
    program.format,
    program.sessionCount ? `${program.sessionCount} sessions` : null,
    program.cost || null,
    formatDate(program.nextStartDate) ? `Next start ${formatDate(program.nextStartDate)}` : null
  ].filter(Boolean)

  return (
    <article className="program-card">
      <div className="program-card__header">
        <span className="program-card__badge">Verified Program</span>
        <h3>{program.name}</h3>
        <p className="program-card__church">
          {program.church?.name}
          {location ? ` · ${location}` : ''}
        </p>
      </div>

      {program.summary && (
        <p className="program-card__summary">{program.summary}</p>
      )}

      {chips.length > 0 && (
        <div className="program-card__chips">
          {chips.map((chip) => (
            <span key={chip} className="program-card__chip">{chip}</span>
          ))}
        </div>
      )}

      {(program.timeline || languages.length > 0) && (
        <div className="program-card__details">
          {program.timeline && (
            <p>
              <strong>Timeline:</strong> {program.timeline}
            </p>
          )}
          {languages.length > 0 && (
            <p>
              <strong>Languages:</strong> {languages.join(', ')}
            </p>
          )}
        </div>
      )}

      {requirementList.length > 0 && (
        <ul className="program-card__requirements">
          {requirementList.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      <div className="program-card__actions">
        {program.registrationUrl ? (
          <a
            href={program.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            View Program
          </a>
        ) : (
          <a href="mailto:hello@weddingcounselors.com" className="btn btn-primary">
            Request Details
          </a>
        )}

        {program.church?.website && (
          <a
            href={program.church.website}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Parish Website
          </a>
        )}
      </div>
    </article>
  )
}

export default ProgramCard
