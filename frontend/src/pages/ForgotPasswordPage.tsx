import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { ui } from '../components/styles'
import { ApiError } from '../services/apiClient'
import { requestPasswordReset } from '../services/accountService'

/** "Forgot password?": asks for the email and sends a reset link. */
export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429 ? t('account.tooMany') : t('account.resetRequestFailed'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell kicker={t('account.kicker')} title={t('account.forgotTitle')} subtitle={t('account.forgotSubtitle')}>
      {sent ? (
        <p role="status" className="mt-6 rounded-2xl bg-sage-100 px-4 py-3 text-sm font-medium text-forest-800">
          {t('account.resetSent')}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {error && (
            <div role="alert" className={ui.error}>
              {error}
            </div>
          )}
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-forest-800">
              {t('auth.email')}
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={ui.input}
            />
          </div>
          <button type="submit" disabled={submitting} className={`w-full py-3 ${ui.btnPrimary}`}>
            {submitting ? t('care.saving') : t('account.sendLink')}
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
