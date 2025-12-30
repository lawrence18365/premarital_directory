import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import './utils/webVitals' // Initialize Web Vitals monitoring
import './utils/structuredDataValidator' // Initialize structured data validation

const rootElement = document.getElementById('root')
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Use hydrate if pre-rendered HTML exists (react-snap), otherwise render fresh
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app)
} else {
  createRoot(rootElement).render(app)
}

// Cleanly hide the HTML preloader once React mounts, ensuring a minimum visible time
try {
  const pre = document.getElementById('wc-preloader')
  const start = window.__WC_START || (performance.now ? performance.now() : Date.now())
  const now = performance.now ? performance.now() : Date.now()
  const elapsed = now - start
  const minVisible = 400 // ms
  const delay = Math.max(0, minVisible - elapsed)
  if (pre) {
    setTimeout(() => {
      pre.classList.add('hidden')
      setTimeout(() => pre.remove && pre.remove(), 350)
    }, delay)
  }
  document.body.classList.add('loaded')
} catch {}
