import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './utils/webVitals' // Initialize Web Vitals monitoring
import './utils/structuredDataValidator' // Initialize structured data validation

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

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
