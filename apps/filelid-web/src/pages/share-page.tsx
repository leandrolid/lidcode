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

export function SharePage({ id }: { id: string }) {
  const [share, setShare] = useState<Share | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [gone, setGone] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [attempt, setAttempt] = useState(0)
  const token = getManagementToken(id)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    getShare(id, controller.signal)
      .then(setShare)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && [404, 410].includes(error.status)) setGone(true)
        else setError(error instanceof Error ? error.message : 'Could not load this share.')
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
          <p>Finding your little delivery...</p>
        </div>
      </main>
    )
  if (expired)
    return (
      <main className="share-page">
        <div className="share-card empty-card">
          <PackageOpen size={55} strokeWidth={1} />
          <span className="mono">NOTHING LEFT BEHIND</span>
          <h1>
            This one has
            <br />
            <em>moved on.</em>
          </h1>
          <p>
            The share has expired, been deleted, or doesn&apos;t exist. Temporary means temporary.
          </p>
          <a className="primary-button" href="/">
            Make a new share <ArrowUpRight size={19} />
          </a>
        </div>
      </main>
    )
  if (error || !share)
    return (
      <main className="share-page">
        <div className="share-card empty-card">
          <h1>
            A small
            <br />
            <em>interruption.</em>
          </h1>
          <p role="alert">{error || 'This share could not be loaded.'}</p>
          <button className="primary-button" onClick={() => setAttempt(attempt + 1)}>
            Try again <ArrowUpRight size={19} />
          </button>
        </div>
      </main>
    )

  const total = share.files.reduce((sum, file) => sum + file.size, 0)
  return (
    <main className="share-page">
      <a className="back-link mono" href="/">
        <ArrowLeft size={15} /> BACK TO FILELID
      </a>
      <section className="share-card">
        <div className="panel-eyebrow">
          <span className="mono">A LITTLE DELIVERY FOR YOU</span>
          <span className="live-dot" />
        </div>
        <div className="download-heading">
          <h1>
            Here for a<br />
            <em>good time.</em>
          </h1>
          <span className="delivery-icon">
            <PackageOpen size={48} strokeWidth={1} />
          </span>
        </div>
        <p className="download-description">
          Someone sent you {share.files.length === 1 ? 'a file' : 'a few files'}. Take what you need
          before they go.
        </p>
        <div className="share-stats">
          <span>
            <Clock3 size={16} />
            {formatRemaining(remaining)}
          </span>
          <span className="mono">
            {share.files.length} {share.files.length === 1 ? 'FILE' : 'FILES'}{' '}
            <span className="stat-divider">/</span> {formatSize(total)}
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
                aria-label={`Download ${file.name}`}
              >
                <Download size={17} />
                <span>Download</span>
              </a>
            </FileRow>
          ))}
        </ul>
        <p className="download-expiry">
          Available until{' '}
          {new Date(share.expiresAt).toLocaleString('en', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
          . Files are removed automatically.
        </p>
        <div className="download-footer">
          <span>
            <ShieldCheck size={15} /> No account needed.
          </span>
          {token && <DeleteShare id={id} token={token} onDeleted={() => setGone(true)} />}
        </div>
      </section>
      <p className="share-outro">
        Have something to pass along?{' '}
        <a href="/">
          Make a little space. <ArrowUpRight size={14} />
        </a>
      </p>
    </main>
  )
}
