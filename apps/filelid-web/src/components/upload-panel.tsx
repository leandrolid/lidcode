import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Copy,
  Link2,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'
import { ApiError, rememberToken, uploadShare, type CreatedShare } from '../lib/api'
import { formatSize } from '../lib/format'
import { useLanguage } from '../lib/i18n'
import type { MessageKey } from '../lib/translations'
import { DeleteShare } from './delete-share'
import { FileRow } from './file-row'

const maxBytes = 100 * 1024 * 1024
const expirationOptions = [
  { hours: 1, label: 'upload.oneHour' },
  { hours: 24, label: 'upload.oneDay' },
  { hours: 168, label: 'upload.oneWeek' },
] as const

export function UploadPanel() {
  const { language, t } = useLanguage()
  const [files, setFiles] = useState<File[]>([])
  const [expiresIn, setExpiresIn] = useState(24)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<MessageKey | null>(null)
  const [created, setCreated] = useState<CreatedShare | null>(null)
  const [copied, setCopied] = useState(false)
  const [remembered, setRemembered] = useState(true)
  const [deleted, setDeleted] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const linkInput = useRef<HTMLInputElement>(null)
  const upload = useRef<ReturnType<typeof uploadShare> | null>(null)
  const totalBytes = files.reduce((total, file) => total + file.size, 0)

  useEffect(() => () => upload.current?.cancel(), [])

  function addFiles(incoming: File[]) {
    if (busy) return
    setError(null)
    const next = [...files]
    for (const file of incoming) {
      if (
        !next.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified,
        )
      )
        next.push(file)
    }
    if (next.length > 10) return setError('errors.tooManyFiles')
    if (next.reduce((total, file) => total + file.size, 0) > maxBytes)
      return setError('errors.totalSize')
    setFiles(next)
  }

  async function sendFiles() {
    if (!files.length || busy) return
    setBusy(true)
    setError(null)
    setProgress(0)
    const request = uploadShare(files, expiresIn, setProgress)
    upload.current = request
    try {
      const result = await request.promise
      setRemembered(rememberToken(result.share.id, result.managementToken))
      setCreated(result)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        setError(error instanceof ApiError ? error.messageKey : 'errors.upload')
    } finally {
      setBusy(false)
      upload.current = null
    }
  }

  async function copyLink() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.shareUrl)
      setCopied(true)
    } catch {
      linkInput.current?.focus()
      linkInput.current?.select()
      setError('errors.copy')
    }
  }

  function reset() {
    setCreated(null)
    setFiles([])
    setCopied(false)
    setDeleted(false)
    setError(null)
  }

  if (created)
    return (
      <section className="upload-panel success-panel" aria-label={t('upload.shareLabel')}>
        <div className="panel-eyebrow">
          <span className="mono">{t('upload.complete')}</span>
          <CheckCheck size={17} />
        </div>
        <div className="success-mark">
          <Check size={34} strokeWidth={1.5} />
        </div>
        <h2>{t(deleted ? 'upload.deletedTitle' : 'upload.readyTitle')}</h2>
        <p className="panel-description">
          {deleted
            ? t('upload.deletedDescription')
            : t(
                created.share.files.length === 1
                  ? 'upload.readyDescription.one'
                  : 'upload.readyDescription.other',
                { count: created.share.files.length },
              )}
        </p>
        {!deleted && (
          <>
            <label className="mono link-label" htmlFor="share-link">
              {t('upload.linkLabel')}
            </label>
            <div className="share-link">
              <Link2 size={18} />
              <input
                ref={linkInput}
                id="share-link"
                readOnly
                value={created.shareUrl}
                onFocus={(event) => event.target.select()}
              />
              <button
                className="icon-button"
                onClick={copyLink}
                aria-label={t(copied ? 'upload.linkCopied' : 'upload.copyLabel')}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <button className="primary-button" onClick={copyLink}>
              {t(copied ? 'upload.copied' : 'upload.copy')}
              {copied ? <Check size={19} /> : <ArrowUpRight size={19} />}
            </button>
            <p className="expiry-note">
              {t('upload.expiry', {
                date: new Date(created.share.expiresAt).toLocaleString(language, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }),
              })}
            </p>
            <div className="success-bottom">
              <Link className="text-button" to="/s/$id" params={{ id: created.share.id }}>
                {t('upload.open')} <ArrowUpRight size={14} />
              </Link>
              <DeleteShare
                id={created.share.id}
                token={created.managementToken}
                onDeleted={() => setDeleted(true)}
              />
            </div>
            {!remembered && <p className="expiry-note">{t('upload.storageUnavailable')}</p>}
          </>
        )}
        {error && (
          <p role="alert" className="error-message">
            {t(error)}
          </p>
        )}
        <button className="text-button another-share" onClick={reset}>
          <Plus size={16} /> {t('upload.another')}
        </button>
      </section>
    )

  return (
    <section className="upload-panel" aria-label={t('upload.createLabel')}>
      <div className="panel-eyebrow">
        <span className="mono">{t('upload.newTransfer')}</span>
        <span className="panel-number mono">/ 001</span>
      </div>
      <div className="panel-heading">
        <h2>
          {t('upload.title')}
          <br />
          {t('upload.titleEnd')}
        </h2>
        <ArrowUpRight size={30} strokeWidth={1.2} />
      </div>
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        aria-label={t('upload.chooseFiles')}
        onChange={(event) => {
          addFiles(Array.from(event.target.files || []))
          event.target.value = ''
        }}
      />
      <button
        className={`dropzone ${dragging ? 'is-dragging' : ''} ${files.length ? 'has-files' : ''}`}
        disabled={busy}
        type="button"
        onClick={() => fileInput.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          if (!busy) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          addFiles(Array.from(event.dataTransfer.files))
        }}
      >
        <span className="upload-symbol">
          <Upload size={27} strokeWidth={1.3} />
          <span className="symbol-plus">+</span>
        </span>
        <span className="dropzone-title">
          {t(dragging ? 'upload.dropDragging' : files.length ? 'upload.dropMore' : 'upload.drop')}
        </span>
        <span className="dropzone-detail">
          {t('upload.browseStart')} <span>{t('upload.browse')}</span> {t('upload.browseEnd')}
        </span>
        <span className="dropzone-limit mono">
          {t('upload.limit')} <span>/</span> {t('upload.fileLimit')}
        </span>
      </button>
      {files.length > 0 && (
        <>
          <div className="file-list-label mono">
            <span>
              {t(files.length === 1 ? 'upload.selected.one' : 'upload.selected.other', {
                count: files.length,
              })}
            </span>
            <span>{formatSize(totalBytes, language)} / 100 MB</span>
          </div>
          <ul className="file-list selected-files">
            {files.map((file, index) => (
              <FileRow
                key={`${file.name}:${file.lastModified}:${file.size}`}
                name={file.name}
                size={file.size}
              >
                <button
                  disabled={busy}
                  className="icon-button"
                  aria-label={t('upload.remove', { name: file.name })}
                  onClick={() => {
                    setFiles(files.filter((_, position) => index !== position))
                    setError(null)
                  }}
                >
                  <X size={16} />
                </button>
              </FileRow>
            ))}
          </ul>
        </>
      )}
      <fieldset className="expiration" disabled={busy}>
        <legend className="mono">{t('upload.expiration')}</legend>
        <div className="expiration-options">
          {expirationOptions.map((option) => (
            <label
              className={`expiration-option ${expiresIn === option.hours ? 'is-selected' : ''}`}
              key={option.hours}
            >
              <input
                type="radio"
                name="expiration"
                value={option.hours}
                checked={expiresIn === option.hours}
                onChange={() => setExpiresIn(option.hours)}
              />
              <span>{t(option.label)}</span>
              {expiresIn === option.hours && <span className="selection-dot" />}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="error-message" role="alert">
          {t(error)}
        </p>
      )}
      {busy && (
        <div
          className="upload-progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('upload.progress')}
        >
          <div className="progress-label mono">
            <span>{t(progress === 100 ? 'upload.finalizing' : 'upload.makingSpace')}</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <button className="primary-button" disabled={!files.length || busy} onClick={sendFiles}>
        {busy ? (
          <>
            <span>{t(progress === 100 ? 'upload.almost' : 'upload.sending')}</span>
            <LoaderCircle size={20} className="spin" />
          </>
        ) : (
          <>
            <span>{t('upload.create')}</span>
            <ArrowRight size={20} />
          </>
        )}
      </button>
      {busy ? (
        <button className="text-button cancel-upload" onClick={() => upload.current?.cancel()}>
          {t('upload.cancel')}
        </button>
      ) : (
        <p className="panel-footnote">
          <ShieldCheck size={14} /> {t('upload.privacy')}
        </p>
      )}
    </section>
  )
}
