import { useEffect, useRef, useState } from 'react'
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
import { rememberToken, uploadShare, type CreatedShare } from '../lib/api'
import { formatSize } from '../lib/format'
import { DeleteShare } from './delete-share'
import { FileRow } from './file-row'

const maxBytes = 100 * 1024 * 1024
const expirationOptions = [
  { hours: 1, label: '1 hour' },
  { hours: 24, label: '24 hours' },
  { hours: 168, label: '7 days' },
]

export function UploadPanel() {
  const [files, setFiles] = useState<File[]>([])
  const [expiresIn, setExpiresIn] = useState(24)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
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
    setError('')
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
    if (next.length > 10)
      return setError('A little less, please. You can share up to 10 files at once.')
    if (next.reduce((total, file) => total + file.size, 0) > maxBytes)
      return setError('Your files add up to more than 100 MB. Try removing a file.')
    setFiles(next)
  }

  async function sendFiles() {
    if (!files.length || busy) return
    setBusy(true)
    setError('')
    setProgress(0)
    const request = uploadShare(files, expiresIn, setProgress)
    upload.current = request
    try {
      const result = await request.promise
      setRemembered(rememberToken(result.share.id, result.managementToken))
      setCreated(result)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        setError(error instanceof Error ? error.message : 'The upload failed. Try again.')
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
      setError('Copy the selected link manually with Ctrl+C or Cmd+C.')
    }
  }

  function reset() {
    setCreated(null)
    setFiles([])
    setCopied(false)
    setDeleted(false)
    setError('')
  }

  if (created)
    return (
      <section className="upload-panel success-panel" aria-label="Your share">
        <div className="panel-eyebrow">
          <span className="mono">TRANSFER COMPLETE</span>
          <CheckCheck size={17} />
        </div>
        <div className="success-mark">
          <Check size={34} strokeWidth={1.5} />
        </div>
        <h2>{deleted ? 'Gone, just like that.' : 'Ready for a short stay.'}</h2>
        <p className="panel-description">
          {deleted
            ? 'Your files have been deleted and the link is disabled.'
            : `${created.share.files.length} ${created.share.files.length === 1 ? 'file' : 'files'}, one link. Send it to someone good.`}
        </p>
        {!deleted && (
          <>
            <label className="mono link-label" htmlFor="share-link">
              YOUR SHARING LINK
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
                aria-label={copied ? 'Link copied' : 'Copy share link'}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <button className="primary-button" onClick={copyLink}>
              {copied ? 'Copied. Pass it on.' : 'Copy sharing link'}
              {copied ? <Check size={19} /> : <ArrowUpRight size={19} />}
            </button>
            <p className="expiry-note">
              Disappears{' '}
              {new Date(created.share.expiresAt).toLocaleString('en', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
              . Anyone with the link can download.
            </p>
            <div className="success-bottom">
              <a className="text-button" href={`/s/${created.share.id}`}>
                Open share <ArrowUpRight size={14} />
              </a>
              <DeleteShare
                id={created.share.id}
                token={created.managementToken}
                onDeleted={() => setDeleted(true)}
              />
            </div>
            {!remembered && (
              <p className="expiry-note">
                Browser storage is unavailable. Keep this page open if you want to delete the share
                early.
              </p>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <button className="text-button another-share" onClick={reset}>
          <Plus size={16} /> Share something else
        </button>
      </section>
    )

  return (
    <section className="upload-panel" aria-label="Create a file share">
      <div className="panel-eyebrow">
        <span className="mono">A NEW TRANSFER</span>
        <span className="panel-number mono">/ 001</span>
      </div>
      <div className="panel-heading">
        <h2>
          Make room for
          <br />
          something temporary.
        </h2>
        <ArrowUpRight size={30} strokeWidth={1.2} />
      </div>
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        aria-label="Choose files to share"
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
          {dragging
            ? 'Let them go right here.'
            : files.length
              ? 'A little something else?'
              : 'Drop your files here'}
        </span>
        <span className="dropzone-detail">
          or <span>browse files</span> to get started
        </span>
        <span className="dropzone-limit mono">
          UP TO 100 MB <span>/</span> 10 FILES
        </span>
      </button>
      {files.length > 0 && (
        <>
          <div className="file-list-label mono">
            <span>
              {files.length} {files.length === 1 ? 'FILE' : 'FILES'} SELECTED
            </span>
            <span>{formatSize(totalBytes)} / 100 MB</span>
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
                  aria-label={`Remove ${file.name}`}
                  onClick={() => {
                    setFiles(files.filter((_, position) => index !== position))
                    setError('')
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
        <legend className="mono">LET IT DISAPPEAR AFTER</legend>
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
              <span>{option.label}</span>
              {expiresIn === option.hours && <span className="selection-dot" />}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <div
          className="upload-progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div className="progress-label mono">
            <span>{progress === 100 ? 'FINALIZING YOUR SHARE' : 'MAKING A LITTLE SPACE'}</span>
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
            <span>{progress === 100 ? 'Almost there...' : 'Sending your files...'}</span>
            <LoaderCircle size={20} className="spin" />
          </>
        ) : (
          <>
            <span>Create a sharing link</span>
            <ArrowRight size={20} />
          </>
        )}
      </button>
      {busy ? (
        <button className="text-button cancel-upload" onClick={() => upload.current?.cancel()}>
          Cancel upload
        </button>
      ) : (
        <p className="panel-footnote">
          <ShieldCheck size={14} /> Private storage. Automatic cleanup.
        </p>
      )}
    </section>
  )
}
