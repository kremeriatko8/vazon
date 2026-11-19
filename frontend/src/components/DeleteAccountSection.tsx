import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/apiClient'
import { deleteAccount } from '../services/accountService'
import { ui } from './styles'

/** Settings: delete the account with all its data, confirmed by typing the email. */
export function DeleteAccountSection() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const matches = Boolean(user?.email) && confirm.trim().toLowerCase() === user?.email.toLowerCase()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!matches) return
    setDeleting(true)
    setError(null)
    try {
      await deleteAccount(confirm.trim())
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400 ? t('account.deleteMismatch') : t('account.deleteFailed'))
      setDeleting(false)
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-title">
        <span>
          <Trash2 />
        </span>
        <div>
          <h2>{t('account.deleteTitle')}</h2>
          <p>{t('account.deleteHint')}</p>
        </div>
      </div>
      {!open ? (
        <button type="button" className={ui.btnDanger} onClick={() => setOpen(true)}>
          {t('account.deleteStart')}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="delete-confirm" className="block text-sm text-forest-800">
            {t('account.deleteConfirmLabel', { email: user?.email ?? '' })}
          </label>
          <input
            id="delete-confirm"
            type="email"
            autoComplete="off"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={ui.input}
          />
          {error && (
            <p role="alert" className={ui.error}>
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={ui.btnDanger} disabled={!matches || deleting}>
              {deleting ? t('care.saving') : t('account.deleteForever')}
            </button>
            <button type="button" className={ui.btnSecondary} onClick={() => setOpen(false)}>
              {t('care.tooEarly.cancel')}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
