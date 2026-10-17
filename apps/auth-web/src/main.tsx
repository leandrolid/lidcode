import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/outfit/latin-400.css'
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import '@lidcode/elements'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './styles.css'

function LoadingAccount() {
  return <div className="route-pending" role="status">Loading your account...</div>
}

const router = createRouter({ routeTree, defaultPendingMs: 300, defaultPendingComponent: LoadingAccount })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('Missing application root')

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
