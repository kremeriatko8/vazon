import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { ui } from '../components/styles'
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
        initialError: googleErrorText(oauthError, isUk),
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
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:py-28">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-mint text-olive-800 ${error ? '' : 'animate-plant-float'}`}
        aria-hidden="true"
      >
        <Sprout size={30} />
      </span>
      {error ? (
        <>
          <h1 className="mt-6 font-display text-3xl font-medium text-ink">
            {isUk ? 'Не вдалося увійти' : 'Sign-in did not work'}
          </h1>
          <p role="alert" className={`mt-4 w-full ${ui.error}`}>
            {error}
          </p>
          <Link to="/login" className={`mt-6 ${ui.btnPrimary}`}>
            {isUk ? 'Повернутися до входу' : 'Back to log in'}
          </Link>
        </>
      ) : (
        <>
          <h1 className="mt-6 font-display text-3xl font-medium text-ink">
            {isUk ? 'Завершуємо вхід…' : 'Completing sign-in…'}
          </h1>
          <p className="mt-2 text-sm text-forest-700/80">
            {isUk ? 'Зачекайте кілька секунд, готуємо ваші рослини.' : 'Please wait a moment while we prepare your plants.'}
          </p>
        </>
      )}
    </section>
  )
}

/** A plain-language message for the error codes the backend sends back from Google sign-in. */
function googleErrorText(code: string, isUk: boolean): string {
  const messages: Record<string, [string, string]> = {
    access_denied: ['Sign-in was cancelled on the Google page.', 'Вхід скасовано на сторінці Google.'],
    google_not_configured: ['Google sign-in is not set up on this server yet. Use email and password.', 'Вхід через Google на цьому сервері ще не налаштовано. Увійдіть з поштою й паролем.'],
    email_not_verified: ['Your Google account email is not verified.', 'Пошту вашого Google-акаунта не підтверджено.'],
    invalid_state: ['The sign-in link expired. Please try again.', 'Посилання для входу застаріло. Спробуйте ще раз.'],
    account_conflict: ['This email is already linked to another Google account.', 'Цю пошту вже прив’язано до іншого Google-акаунта.'],
  }
  const known = messages[code]
  if (known) return isUk ? known[1] : known[0]
  return isUk ? 'Не вдалося увійти через Google. Спробуйте ще раз.' : 'Google sign-in failed. Please try again.'
}
