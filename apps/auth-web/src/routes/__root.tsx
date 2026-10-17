import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => search,
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <div className="account-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link to="/" className="brand" aria-label="Lidcode Account home">
          lidcode<span aria-hidden="true">.</span>
        </Link>
        <span className="mono header-label">Account / Identity</span>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <span className="mono">Your identity. Your connections.</span>
        <lidcode-made-by />
      </footer>
    </div>
  )
}

function NotFound() {
  return (
    <section className="intro">
      <p className="eyebrow">404 / Page not found</p>
      <h1>
        A different <em>direction.</em>
      </h1>
      <p>
        This page could not be found. <Link to="/">Return to your account.</Link>
      </p>
    </section>
  )
}
