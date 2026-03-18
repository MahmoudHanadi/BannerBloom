import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const CHUNK_RELOAD_STORAGE_KEY = 'bannerbloom:chunk-reload-entry'

const getEntryScriptSrc = () =>
  document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src ?? window.location.href

const installChunkReloadRecovery = () => {
  const currentEntryScript = getEntryScriptSrc()
  const lastReloadedEntryScript = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY)

  if (lastReloadedEntryScript && lastReloadedEntryScript !== currentEntryScript) {
    sessionStorage.removeItem(CHUNK_RELOAD_STORAGE_KEY)
  }

  // Recover once when a stale entry bundle points at a deleted chunk after deployment.
  window.addEventListener('vite:preloadError', (event) => {
    const entryScript = getEntryScriptSrc()

    if (sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) === entryScript) {
      return
    }

    event.preventDefault()
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, entryScript)
    window.location.reload()
  })
}

installChunkReloadRecovery()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
