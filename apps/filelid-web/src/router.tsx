import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  notFound,
  Outlet,
  useLocation,
} from '@tanstack/react-router'
import { ArrowDown, Languages, Orbit } from 'lucide-react'
import { HomePage } from './pages/home-page'
import { SharePage } from './pages/share-page'
import { NotFoundPage } from './pages/not-found-page'
import { useLanguage } from './lib/i18n'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function RootLayout() {
  const { language, setLanguage, t } = useLanguage()
  const pathname = useLocation({ select: (location) => location.pathname })
  const isHome = pathname === '/'

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link to="/" className="brand" aria-label={t('header.home')}>
          <span className="brand-symbol">
            <Orbit size={29} strokeWidth={1.7} />
          </span>
          filelid<span className="brand-period">.</span>
        </Link>
        <div className="header-right">
          {isHome && (
            <a href="#how-it-works" className="header-link">
              {t('header.shortVersion')} <ArrowDown size={13} />
            </a>
          )}
          <span className="header-note mono">
            <span className="live-dot" /> {t('header.note')}
          </span>
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <span className="mono">{t('footer.tagline')}</span>
        <label className="language-selector" htmlFor="language">
          <Languages size={15} aria-hidden="true" />
          <span className="mono">{t('footer.language')}</span>
          <select
            id="language"
            value={language}
            onChange={(event) => {
              const next = event.target.value
              if (next === 'en' || next === 'pt-BR') setLanguage(next)
            }}
          >
            <option value="en" lang="en">
              {t('language.en')}
            </option>
            <option value="pt-BR" lang="pt-BR">
              {t('language.ptBR')}
            </option>
          </select>
        </label>
        <span className="footer-note">
          {t('footer.note')}
          <span className="footer-spark">*</span>
        </span>
      </footer>
    </div>
  )
}

export const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

export const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/s/$id',
  beforeLoad: ({ params }) => {
    if (!UUID_REGEX.test(params.id)) {
      throw notFound()
    }
  },
  component: ShareRouteComponent,
})

function ShareRouteComponent() {
  const { id } = shareRoute.useParams()
  return <SharePage id={id} />
}

const routeTree = rootRoute.addChildren([indexRoute, shareRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
