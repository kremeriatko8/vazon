import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AuthCallbackPage() {
  const { i18n } = useTranslation()
  const isUk = i18n.language === 'uk'
  const location = useLocation()
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()
  const [asyncError, setAsyncError] = useState<string | null>(null)
  const handledRef = useRef(false)

  const parsed = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))

    const oauthError = searchParams.get('error') ?? hashParams.get('error')
    if (oauthError) {
      return {
        initialError: isUk
          ? `Помилка входу через Google: ${oauthError}`
          : `Google sign-in failed: ${oauthError}`,
        accessToken: null,
        providedUser: null,
      }
    }

    const accessToken =
      searchParams.get('accessToken') ??
      searchParams.get('token') ??
      hashParams.get('accessToken') ??
      hashParams.get('token')

    if (!accessToken) {
      return {
        initialError: isUk
          ? 'Не вдалося отримати токен авторизації від Google.'
          : 'No authentication token was returned from Google.',
        accessToken: null,
        providedUser: null,
      }
    }

    const email = searchParams.get('email') ?? hashParams.get('email')
    const id = searchParams.get('id') ?? searchParams.get('userId') ?? 'oauth-user'

    return {
      initialError: null,
      accessToken,
      providedUser: email ? { id, email } : null,
    }
  }, [isUk, location.hash, location.search])

  useEffect(() => {
    if (handledRef.current || !parsed.accessToken) return
    handledRef.current = true

    loginWithToken(parsed.accessToken, parsed.providedUser)
      .then(() => {
        navigate('/plants', { replace: true })
      })
      .catch((err: unknown) => {
        setAsyncError(
          err instanceof Error
            ? err.message
            : isUk
              ? 'Не вдалося завершити вхід.'
              : 'Unable to complete sign-in.',
        )
      })
  }, [isUk, loginWithToken, navigate, parsed])

  const error = parsed.initialError ?? asyncError

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="rounded-3xl border border-beige bg-white p-6 text-center shadow-sm sm:p-8">
        {error ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-forest-800">
              {isUk ? 'Помилка авторизації' : 'Authentication error'}
            </h1>
            <p role="alert" className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-full bg-forest-700 px-6 py-2.5 text-sm font-medium text-ivory transition hover:bg-forest-800"
            >
              {isUk ? 'Повернутися до входу' : 'Back to log in'}
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold text-forest-800">
              {isUk ? 'Завершуємо вхід…' : 'Completing sign-in…'}
            </h1>
            <p className="mt-2 text-sm text-forest-700/80">
              {isUk
                ? 'Будь ласка, зачекайте кілька секунд.'
                : 'Please wait a moment while we prepare your plants.'}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
