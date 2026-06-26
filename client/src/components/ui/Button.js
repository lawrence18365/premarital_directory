import React from 'react'
import './ui.css'

/*
 * Button
 *
 * Reuses the existing global .btn / .btn-primary etc. classes so adoption is
 * mechanical and visually identical to the legacy markup:
 *   <Button variant="primary">   ->  class="btn btn-primary ui-btn"
 *   <Button variant="secondary"> ->  class="btn btn-secondary ui-btn"
 *   <Button variant="outline">   ->  class="btn btn-outline ui-btn"
 *   <Button variant="ghost">     ->  class="btn btn-ghost ui-btn"
 *   <Button variant="destructive"> -> class="btn btn-destructive ui-btn" (new)
 *   size sm/md/lg                 ->  btn-small / (none) / btn-large
 *   fullWidth                     ->  btn-full
 *
 * Props:
 *   variant   "primary" | "secondary" | "outline" | "ghost" | "destructive"
 *   size      "sm" | "md" | "lg"
 *   loading   boolean (shows spinner, disables interaction)
 *   disabled  boolean
 *   fullWidth boolean
 *   as        "button" | "a" (render element)
 *   ...rest   passthrough props (onClick, href, type, aria-*, etc.)
 */

const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  destructive: 'btn-destructive'
}

const SIZE_CLASS = {
  sm: 'btn-small',
  md: '',
  lg: 'btn-large'
}

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  as = 'button',
  className = '',
  children,
  type,
  ...rest
}) => {
  const Component = as
  const isDisabled = disabled || loading

  const classes = [
    'btn',
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    SIZE_CLASS[size] || '',
    fullWidth ? 'btn-full' : '',
    'ui-btn',
    loading ? 'ui-btn--loading' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  // Native <button> gets a real disabled attribute; anchors and other
  // elements get aria-disabled so assistive tech reports the state.
  const stateProps =
    Component === 'button'
      ? { disabled: isDisabled, type: type || 'button' }
      : { 'aria-disabled': isDisabled || undefined }

  return (
    <Component className={classes} aria-busy={loading || undefined} {...stateProps} {...rest}>
      {loading && <span className="ui-btn__spinner" aria-hidden="true" />}
      {children}
    </Component>
  )
}

export default Button
