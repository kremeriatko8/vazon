import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { GoogleButton } from '../components/GoogleButton'
import { ui } from '../components/styles'
import { useAuth } from '../hooks/useAuth'
import { updateSettings } from '../services/settingsService'

export function RegisterPage() {
  const { t } = useTranslation()
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/plants" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError(null)
    if (!email.trim() || !email.includes('@')) {
      setServerError(t('auth.errEmail'))
      return
    }
    if (password.length < 8) {
      setServerError(t('auth.errPasswordLength'))
      return
    }
    if (password !== confirmPassword) {
      setServerError(t('auth.errMismatch'))
      return
    }
    setSubmitting(true)
    try {
      await register({ email, password })
      if (name.trim()) {
        // Best effort: the account exists even if saving the name fails; it can be set in Settings.
        await updateSettings({ displayName: name.trim() }).catch(() => undefined)
      }
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t('auth.errRegister'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell kicker={t('auth.getStarted')} title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>

        {serverError && (
          <div role="alert" className={`mt-5 ${ui.error}`}>
            {serverError}
          </div>
        )}

        <div className="mt-6">
          <GoogleButton />
        </div>
        <p className="my-5 flex items-center gap-3 text-xs text-forest-700/60">
          <span className="h-px flex-1 bg-beige" /> {t('auth.or')} <span className="h-px flex-1 bg-beige" />
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="register-name" className="block text-sm font-medium text-forest-800">{t('auth.nameLabel')}</label>
            <input
              id="register-name"
              type="text"
              autoComplete="given-name"
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.namePlaceholder')}
              className={ui.input}
            />
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-forest-800">{t('auth.email')}</label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={ui.input}
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-forest-800">{t('auth.password')}</label>
            <input
              id="register-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordHint')}
              className={ui.input}
            />
          </div>

          <div>
            <label htmlFor="register-confirm" className="block text-sm font-medium text-forest-800">{t('auth.confirmPassword')}</label>
            <input
              id="register-confirm"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.repeatPassword')}
              className={ui.input}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`mt-2 w-full py-3 ${ui.btnPrimary}`}
          >
            {submitting ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-forest-700/80">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-forest-700 underline hover:text-forest-900">{t('auth.logInTitle')}</Link>
        </p>
    </AuthShell>
  )
}
