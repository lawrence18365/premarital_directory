/**
 * Detect if the current execution is a react-snap prerender.
 *
 * react-snap sets navigator.userAgent to "ReactSnap" during prerendering.
 * Use this to skip client-only code (analytics, chat widgets, etc.)
 * that shouldn't run during the snapshot phase.
 */
export const isPrerender = () =>
  typeof navigator !== 'undefined' && navigator.userAgent === 'ReactSnap'
