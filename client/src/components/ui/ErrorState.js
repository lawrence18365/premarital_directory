import React from 'react'
import './ui.css'

/*
 * ErrorState
 * Governed error layout. Shares the .ui-state structure with EmptyState but
 * colors the icon/title with the error token.
 *
 * Props:
 *   icon         node (defaults to "!")
 *   title        string
 *   description  string | node
 *   action       node (typically a <Button />)
 */
const ErrorState = ({
  icon = '!',
  title = 'Something went wrong',
  description = 'We hit an unexpected error. Please try again.',
  action,
  className = '',
  ...rest
}) => {
  const classes = ['ui-state', 'ui-state--error', className].filter(Boolean).join(' ')

  return (
    <div className={classes} role="alert" {...rest}>
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

export default ErrorState
