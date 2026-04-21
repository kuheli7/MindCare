import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const DEPLOY_API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (DEPLOY_API_BASE_URL && typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const LOCAL_API_BASE = 'http://localhost:5000'
  const originalFetch = window.fetch.bind(window)

  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith(LOCAL_API_BASE)) {
      return originalFetch(input.replace(LOCAL_API_BASE, DEPLOY_API_BASE_URL), init)
    }

    if (input instanceof Request && input.url.startsWith(LOCAL_API_BASE)) {
      const rewritten = new Request(
        input.url.replace(LOCAL_API_BASE, DEPLOY_API_BASE_URL),
        input
      )
      return originalFetch(rewritten, init)
    }

    return originalFetch(input, init)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
