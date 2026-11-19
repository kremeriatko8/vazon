import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { GoogleButton } from '../components/GoogleButton'
import { ui } from '../components/styles'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { t } = useTranslation()
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/plants" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError(null)
    if (!email.trim() || !password) {
      setServerError(t('auth.errBoth'))
      return
    }
    setSubmitting(true)
    try {
      await login({ email, password, rememberMe })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t('auth.errSignIn'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell kicker={t('auth.welcomeBack')} title={t('auth.logInTitle')} subtitle={t('auth.logInSubtitle')}>

        {serverError && (
          <div role="alert" className={`mt-5 ${ui.error}`}>
            {serverError}
          </div>
        )}

        <div className="mt-6">
          <GoogleButton />
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-forest-800">{t('auth.email')}</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={ui.input}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-forest-800">{t('auth.password')}</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={ui.input}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-forest-800">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-beige-dark text-forest-700 focus:ring-forest-600"
            />
            <span>{t('auth.rememberMe')}</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className={`mt-2 w-full py-3 ${ui.btnPrimary}`}
          >
            {submitting ? t('auth.signingIn') : t('auth.logInTitle')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-forest-700/80">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-forest-700 underline hover:text-forest-900">{t('auth.createOne')}</Link>
        </p>

        <p className="mt-4 text-center text-sm text-forest-700/80">
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3100/api/v1'}/privacy`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-forest-700 underline hover:text-forest-900"
          >
            {t('auth.privacy')}
          </a>
        </p>
    </AuthShell>
  )
}
