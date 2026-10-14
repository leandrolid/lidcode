import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/outfit/latin-400.css'
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import { App } from './app'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
