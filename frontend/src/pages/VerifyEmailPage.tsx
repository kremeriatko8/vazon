import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { ui } from '../components/styles'
import { confirmEmail } from '../services/accountService'

type State = 'checking' | 'done' | 'failed'

/** Opened from the link in the verification email: /verify-email?token=... */
export function VerifyEmailPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<State>(token ? 'checking' : 'failed')
  // StrictMode runs effects twice in development; a link works only once.
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    confirmEmail(token)
      .then(() => setState('done'))
      .catch(() => setState('failed'))
  }, [token])

  return (
    <AuthShell kicker={t('account.kicker')} title={t('account.verifyTitle')} subtitle={t('account.verifySubtitle')}>
      {state === 'checking' && <p className={`mt-6 ${ui.muted}`}>{t('account.verifyChecking')}</p>}
      {state === 'done' && (
        <p role="status" className="mt-6 rounded-2xl bg-sage-100 px-4 py-3 text-sm font-medium text-forest-800">
          {t('account.verifyDone')}
        </p>
      )}
      {state === 'failed' && (
        <p role="alert" className={`mt-6 ${ui.error}`}>
          {t('account.linkInvalid')}
        </p>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/dashboard" className="font-medium text-forest-700 underline hover:text-forest-900">
          {t('account.toApp')}
        </Link>
      </p>
    </AuthShell>
  )
}
