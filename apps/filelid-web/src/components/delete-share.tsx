import { useState } from 'react'
import { LoaderCircle, Trash2 } from 'lucide-react'
import { ApiError, deleteShare } from '../lib/api'
import { useLanguage } from '../lib/i18n'
import type { MessageKey } from '../lib/translations'

type Props = { id: string; token: string; onDeleted: () => void }

export function DeleteShare({ id, token, onDeleted }: Props) {
  const { t } = useLanguage()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<MessageKey | null>(null)

  async function removeShare() {
    setBusy(true)
    setError(null)
    try {
      await deleteShare(id, token)
      onDeleted()
    } catch (error) {
      setError(error instanceof ApiError ? error.messageKey : 'errors.delete')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="delete-share">
      {confirming ? (
        <>
          <p>{t('delete.confirm')}</p>
          <div className="delete-actions">
            <button className="text-button danger" disabled={busy} onClick={removeShare}>
              {busy ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />}{' '}
              {t(busy ? 'delete.busy' : 'delete.yes')}
            </button>
            <button className="text-button" disabled={busy} onClick={() => setConfirming(false)}>
              {t('delete.keep')}
            </button>
          </div>
        </>
      ) : (
        <button className="text-button" onClick={() => setConfirming(true)}>
          <Trash2 size={14} /> {t('delete.early')}
        </button>
      )}
      {error && (
        <p className="error-message" role="alert">
          {t(error)} {t('delete.cleanup')}
        </p>
      )}
    </div>
  )
}
