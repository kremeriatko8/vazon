import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { ui } from '../components/styles'
import { ApiError } from '../services/apiClient'
import { resetPassword } from '../services/accountService'

/** Opened from the link in the reset email: /reset-password?token=... */
export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(token ? null : t('account.linkInvalid'))
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8 || password.length > 72) {
      setError(t('account.passwordLength'))
      return
    }
    if (password !== confirm) {
      setError(t('account.passwordsDiffer'))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? t('account.tooMany')
          : err instanceof ApiError && err.status === 400
            ? t('account.linkInvalid')
            : t('account.resetFailed'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell kicker={t('account.kicker')} title={t('account.resetTitle')} subtitle={t('account.resetSubtitle')}>
      {done ? (
        <p role="status" className="mt-6 rounded-2xl bg-sage-100 px-4 py-3 text-sm font-medium text-forest-800">
          {t('account.resetDone')}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {error && (
            <div role="alert" className={ui.error}>
              {error}
            </div>
          )}
          <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-forest-800">
              {t('account.newPassword')}
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={ui.input}
            />
          </div>
          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-medium text-forest-800">
              {t('account.repeatPassword')}
            </label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              required
              maxLength={72}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={ui.input}
            />
          </div>
          <button type="submit" disabled={submitting || !token} className={`w-full py-3 ${ui.btnPrimary}`}>
            {submitting ? t('care.saving') : t('account.saveNewPassword')}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-medium text-forest-700 underline hover:text-forest-900">
          {t('account.backToLogin')}
        </Link>
      </p>
    </AuthShell>
  )
}
