import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

// Track scroll activity globally and expose via data attribute on <html>
let scrollActivityTimeout: number | undefined
const setScrollingActive = () => {
  const root = document.documentElement
  if (!root.hasAttribute('data-scrolling')) {
    root.setAttribute('data-scrolling', 'true')
  }
  if (scrollActivityTimeout) {
    window.clearTimeout(scrollActivityTimeout)
  }
  scrollActivityTimeout = window.setTimeout(() => {
    root.removeAttribute('data-scrolling')
  }, 1000)
}

// Listen to events that imply scrolling within any scrollable container
window.addEventListener('scroll', setScrollingActive, { passive: true, capture: true })
window.addEventListener('wheel', setScrollingActive, { passive: true })
window.addEventListener('touchmove', setScrollingActive, { passive: true })
window.addEventListener('keydown', (e) => {
  const keys = ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End','Space']
  if (keys.includes(e.key)) setScrollingActive()
}, { passive: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
