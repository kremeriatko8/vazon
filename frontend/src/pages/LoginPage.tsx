import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getGoogleOAuthUrl } from '../services/authService'

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
      setServerError('Please enter both email and password.')
      return
    }
    setSubmitting(true)
    try {
      await login({ email, password, rememberMe })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-3xl border border-beige bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">{t('auth.welcomeBack')}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-forest-800">{t('auth.logInTitle')}</h1>
        <p className="mt-2 text-sm text-forest-700/80">{t('auth.logInSubtitle')}</p>

        {serverError && (
          <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {serverError}
          </div>
        )}

        <div className="mt-6">
          <a
            href={getGoogleOAuthUrl()}
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-beige-dark bg-white px-5 py-2.5 text-sm font-medium text-forest-800 transition hover:bg-ivory"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            {t('auth.continueWithGoogle')}
          </a>
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
              className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
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
              className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
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
            className="mt-2 w-full rounded-full bg-forest-700 px-5 py-3 text-sm font-medium text-ivory transition hover:bg-forest-800 disabled:opacity-60"
          >
            {submitting ? t('auth.signingIn') : t('auth.logInTitle')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-forest-700/80">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-forest-700 underline hover:text-forest-900">{t('auth.createOne')}</Link>
        </p>
      </div>
    </section>
  )
}
