import { MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../services/apiClient'
import { getAccount, sendVerificationEmail } from '../services/accountService'

type SendState = 'idle' | 'sending' | 'sent' | 'failed' | 'tooMany'

/** Asks signed-in owners to confirm their email; reminders go only to confirmed addresses. */
export function EmailVerificationBanner() {
  const { t } = useTranslation()
  const [unverified, setUnverified] = useState(false)
  const [state, setState] = useState<SendState>('idle')

  useEffect(() => {
    let cancelled = false
    getAccount()
      .then((account) => {
        if (!cancelled) setUnverified(!account.emailVerified)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  if (!unverified) return null

  async function resend() {
    setState('sending')
    try {
      await sendVerificationEmail()
      setState('sent')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setUnverified(false)
        return
      }
      setState(err instanceof ApiError && err.status === 429 ? 'tooMany' : 'failed')
    }
  }

  return (
    <div role="status" className="product-shell mt-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#d6d9d2] bg-[var(--mint)] px-4 py-3 text-sm text-forest-800">
        <MailCheck size={18} aria-hidden="true" />
        <span className="flex-1">{t('account.bannerText')}</span>
        {state === 'sent' ? (
          <span className="font-medium">{t('account.bannerSent')}</span>
        ) : (
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            disabled={state === 'sending'}
            onClick={() => void resend()}
          >
            {state === 'sending' ? t('care.saving') : t('account.bannerResend')}
          </button>
        )}
        {state === 'failed' && <span className="text-red-800">{t('account.bannerFailed')}</span>}
        {state === 'tooMany' && <span className="text-red-800">{t('account.tooMany')}</span>}
      </div>
    </div>
  )
}
