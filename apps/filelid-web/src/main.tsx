import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/outfit/latin-400.css'
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import { Analytics } from '@vercel/analytics/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app'
import { LanguageProvider } from './lib/i18n'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
    <Analytics />
  </React.StrictMode>,
)
