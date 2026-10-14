import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { ArrowDown, Languages, Orbit } from 'lucide-react'
import { NotFoundPage } from '../pages/not-found-page'
import { useLanguage } from '../lib/i18n'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

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
