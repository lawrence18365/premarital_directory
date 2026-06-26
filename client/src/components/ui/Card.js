import React from 'react'
import './ui.css'

/*
 * Card
 *
 * One radius/shadow/padding system pulled from design tokens.
 *
 * Props:
 *   variant  "default" | "interactive" | "pricing" | "testimonial"
 *            - interactive: hover elevation + focus ring
 *            - pricing: centered column layout
 *            - testimonial: accent left border
 *   as       element to render (default "div")
 *   ...rest  passthrough props (onClick, role, etc.)
 */

const VARIANT_CLASS = {
  default: '',
  interactive: 'ui-card--interactive',
  pricing: 'ui-card--pricing',
  testimonial: 'ui-card--testimonial'
}

const Card = ({ variant = 'default', as = 'div', className = '', children, ...rest }) => {
  const Component = as
  const classes = ['ui-card', VARIANT_CLASS[variant] || '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  )
}

export default Card
