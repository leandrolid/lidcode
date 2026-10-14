import { useState } from 'react'
import { LoaderCircle, Trash2 } from 'lucide-react'
import { deleteShare } from '../lib/api'

type Props = { id: string; token: string; onDeleted: () => void }

export function DeleteShare({ id, token, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function removeShare() {
    setBusy(true)
    setError('')
    try {
      await deleteShare(id, token)
      onDeleted()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not delete this share.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="delete-share">
      {confirming ? (
        <>
          <p>Delete every file and disable this link?</p>
          <div className="delete-actions">
            <button className="text-button danger" disabled={busy} onClick={removeShare}>
              {busy ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />}{' '}
              {busy ? 'Deleting...' : 'Yes, delete share'}
            </button>
            <button className="text-button" disabled={busy} onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </div>
        </>
      ) : (
        <button className="text-button" onClick={() => setConfirming(true)}>
          <Trash2 size={14} /> Delete early
        </button>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error} Access may already be disabled; cleanup will retry automatically.
        </p>
      )}
    </div>
  )
}
