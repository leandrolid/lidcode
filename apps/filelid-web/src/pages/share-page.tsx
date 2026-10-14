import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Download,
  LoaderCircle,
  PackageOpen,
  ShieldCheck,
} from 'lucide-react'
import { ApiError, downloadUrl, getManagementToken, getShare, type Share } from '../lib/api'
import { formatRemaining, formatSize } from '../lib/format'
import { DeleteShare } from '../components/delete-share'
import { FileRow } from '../components/file-row'
import { useLanguage } from '../lib/i18n'
import type { MessageKey } from '../lib/translations'

export function SharePage({ id }: { id: string }) {
  const { language, t } = useLanguage()
  const [share, setShare] = useState<Share | null>(null)
  const [error, setError] = useState<MessageKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [gone, setGone] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [attempt, setAttempt] = useState(0)
  const token = getManagementToken(id)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    getShare(id, controller.signal)
      .then(setShare)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && [404, 410].includes(error.status)) setGone(true)
        else setError(error instanceof ApiError ? error.messageKey : 'errors.load')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [id, attempt])

  useEffect(() => {
    if (!share) return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [share])

  const remaining = share ? new Date(share.expiresAt).getTime() - now : 0
  const expired = gone || (share !== null && remaining <= 0)

  if (loading)
    return (
      <main className="share-page">
        <div className="share-card loading-card" role="status">
          <LoaderCircle className="spin" size={28} />
          <p>{t('share.loading')}</p>
        </div>
      </main>
    )
  if (expired)
    return (
      <main className="share-page">
        <div className="share-card empty-card">
          <PackageOpen size={55} strokeWidth={1} />
          <span className="mono">{t('share.goneLabel')}</span>
          <h1>
            {t('share.goneTitle')}
            <br />
            <em>{t('share.goneEmphasis')}</em>
          </h1>
          <p>{t('share.goneDescription')}</p>
          <a className="primary-button" href="/">
            {t('share.new')} <ArrowUpRight size={19} />
          </a>
        </div>
      </main>
    )
  if (error || !share)
    return (
      <main className="share-page">
        <div className="share-card empty-card">
          <h1>
            {t('share.errorTitle')}
            <br />
            <em>{t('share.errorEmphasis')}</em>
          </h1>
          <p role="alert">{t(error || 'errors.load')}</p>
          <button className="primary-button" onClick={() => setAttempt(attempt + 1)}>
            {t('share.retry')} <ArrowUpRight size={19} />
          </button>
        </div>
      </main>
    )

  const total = share.files.reduce((sum, file) => sum + file.size, 0)
  return (
    <main className="share-page">
      <a className="back-link mono" href="/">
        <ArrowLeft size={15} /> {t('share.back')}
      </a>
      <section className="share-card">
        <div className="panel-eyebrow">
          <span className="mono">{t('share.delivery')}</span>
          <span className="live-dot" />
        </div>
        <div className="download-heading">
          <h1>
            {t('share.title')}
            <br />
            <em>{t('share.titleEmphasis')}</em>
          </h1>
          <span className="delivery-icon">
            <PackageOpen size={48} strokeWidth={1} />
          </span>
        </div>
        <p className="download-description">
          {t(share.files.length === 1 ? 'share.description.one' : 'share.description.other')}
        </p>
        <div className="share-stats">
          <span>
            <Clock3 size={16} />
            {formatRemaining(remaining, t)}
          </span>
          <span className="mono">
            {t(share.files.length === 1 ? 'common.files.one' : 'common.files.other', {
              count: share.files.length,
            })}{' '}
            <span className="stat-divider">/</span> {formatSize(total, language)}
          </span>
        </div>
        <ul className="file-list download-files">
          {share.files.map((file) => (
            <FileRow key={file.id} name={file.name} size={file.size}>
              <a
                className="download-button"
                href={downloadUrl(share.id, file.id)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('share.downloadLabel', { name: file.name })}
              >
                <Download size={17} />
                <span>{t('share.download')}</span>
              </a>
            </FileRow>
          ))}
        </ul>
        <p className="download-expiry">
          {t('share.expiry', {
            date: new Date(share.expiresAt).toLocaleString(language, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }),
          })}
        </p>
        <div className="download-footer">
          <span>
            <ShieldCheck size={15} /> {t('share.noAccount')}
          </span>
          {token && <DeleteShare id={id} token={token} onDeleted={() => setGone(true)} />}
        </div>
      </section>
      <p className="share-outro">
        {t('share.outro')}{' '}
        <a href="/">
          {t('share.outroLink')} <ArrowUpRight size={14} />
        </a>
      </p>
    </main>
  )
}
