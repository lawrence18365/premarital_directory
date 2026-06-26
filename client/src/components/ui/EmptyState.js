import React from 'react'
import './ui.css'

/*
 * EmptyState
 * Consistent icon / title / description / optional action layout for empty
 * lists, no-results screens, etc.
 *
 * Props:
 *   icon         node (e.g. an <i className="fas fa-..." /> or emoji string)
 *   title        string
 *   description  string | node
 *   action       node (typically a <Button />)
 */
const EmptyState = ({ icon, title, description, action, className = '', ...rest }) => {
  const classes = ['ui-state', 'ui-state--empty', className].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      {icon && (
        <div className="ui-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      {title && <h2 className="ui-state__title">{title}</h2>}
      {description && <p className="ui-state__description">{description}</p>}
      {action && <div className="ui-state__action">{action}</div>}
    </div>
  )
}

export default EmptyState
