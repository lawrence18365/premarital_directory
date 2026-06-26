import React, { useId } from 'react'
import './ui.css'

/*
 * Field
 *
 * A labelled form control wrapper. Always renders a real <label> tied to the
 * control via htmlFor/id for accessibility.
 *
 * Props:
 *   label      string (visible label text)
 *   id         control id (auto-generated when omitted)
 *   htmlFor    alias for id (id wins if both are passed)
 *   as         "input" | "textarea" | "select"
 *   type       input type (text/email/password/...) when as="input"
 *   error      string (renders error message + red border)
 *   success    boolean (renders success border)
 *   helperText string (muted hint below the control)
 *   required   boolean
 *   options    array of { value, label } for as="select"
 *   children   <option> nodes for as="select" (used when options omitted)
 *   ...rest    passthrough props onto the control (value, onChange, placeholder...)
 */

const Field = ({
  label,
  id,
  htmlFor,
  as = 'input',
  type = 'text',
  error,
  success = false,
  helperText,
  required = false,
  options,
  className = '',
  children,
  ...rest
}) => {
  const generatedId = useId()
  const controlId = id || htmlFor || generatedId
  const helperId = `${controlId}-helper`
  const messageId = `${controlId}-message`

  const hasError = Boolean(error)
  const describedBy =
    [hasError ? messageId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(' ') || undefined

  const wrapperClasses = [
    'ui-field',
    hasError ? 'ui-field--error' : '',
    success && !hasError ? 'ui-field--success' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const controlProps = {
    id: controlId,
    className: 'ui-field__input',
    required,
    'aria-invalid': hasError || undefined,
    'aria-describedby': describedBy,
    ...rest
  }

  let control
  if (as === 'textarea') {
    control = <textarea {...controlProps} />
  } else if (as === 'select') {
    control = (
      <select {...controlProps}>
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    )
  } else {
    control = <input type={type} {...controlProps} />
  }

  return (
    <div className={wrapperClasses}>
      {label && (
        <label className="ui-field__label" htmlFor={controlId}>
          {label}
          {required && (
            <span className="ui-field__required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {control}

      {hasError && (
        <span id={messageId} className="ui-field__message ui-field__message--error" role="alert">
          {error}
        </span>
      )}

      {helperText && !hasError && (
        <span id={helperId} className="ui-field__helper">
          {helperText}
        </span>
      )}
    </div>
  )
}

export default Field
