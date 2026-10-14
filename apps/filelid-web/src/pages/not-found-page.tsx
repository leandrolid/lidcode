import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { useLanguage } from '../lib/i18n'

export function NotFoundPage() {
  const { t } = useLanguage()

  return (
    <main className="share-page">
      <div className="share-card empty-card">
        <h1>
          {t('notFound.title')}
          <br />
          <em>{t('notFound.titleEmphasis')}</em>
        </h1>
        <p>{t('notFound.description')}</p>
        <Link to="/" className="primary-button">
          {t('common.back')} <ArrowUpRight size={18} />
        </Link>
      </div>
    </main>
  )
}
