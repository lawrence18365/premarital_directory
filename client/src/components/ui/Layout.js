import React from 'react'
import './ui.css'

/*
 * Layout primitives: Section, Container, Stack.
 */

/*
 * Section
 * Full-width vertical-rhythm wrapper with consistent top/bottom padding.
 * Props:
 *   muted   boolean (applies the muted surface background)
 *   as      element to render (default "section")
 */
export const Section = ({ muted = false, as = 'section', className = '', children, ...rest }) => {
  const Component = as
  const classes = ['ui-section', muted ? 'ui-section--muted' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  )
}

/*
 * Container
 * Max-width centered wrapper.
 * Props:
 *   size  "sm" | "md" | "lg" | "xl" | "2xl" (default "xl")
 *   as    element to render (default "div")
 */
export const Container = ({ size = 'xl', as = 'div', className = '', children, ...rest }) => {
  const Component = as
  const classes = ['ui-container', `ui-container--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  )
}

/*
 * Stack
 * Vertical flex column with a gap mapped to a --space-* token.
 * Props:
 *   gap  one of 1,2,3,4,5,6,8,10,12 (default 4)
 *   as   element to render (default "div")
 */
export const Stack = ({ gap = 4, as = 'div', className = '', children, ...rest }) => {
  const Component = as
  const classes = ['ui-stack', `ui-stack--gap-${gap}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  )
}
