import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { sendFeedback, type FeedbackCategory } from '../services/feedbackService'

const CATEGORIES: { value: FeedbackCategory; labelKey: string }[] = [
  { value: 'BUG', labelKey: 'feedback.categoryBug' },
  { value: 'IDEA', labelKey: 'feedback.categoryIdea' },
  { value: 'OTHER', labelKey: 'feedback.categoryOther' },
]

/** Backend limits for POST /feedback. */
const MAX_PAGE_LENGTH = 200

export function FeedbackWidget() {
  const { t, i18n } = useTranslation()
  const isUk = i18n.language === 'uk'

  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>('IDEA')
  const [rating, setRating] = useState<number>(5)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)

  // Prevents state updates (after the request or the close timer) once the widget unmounts.
  const mountedRef = useRef(true)
  const closeTimerRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      window.clearTimeout(closeTimerRef.current)
    }
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!message.trim() || sending) return
    setSending(true)
    setSendError(false)
    try {
      // The backend has no rating field, so the rating travels as the first line of the message.
      await sendFeedback({
        category,
        message: `Rating: ${rating}/5\n${message.trim()}`,
        page: window.location.pathname.slice(0, MAX_PAGE_LENGTH),
      })
      if (!mountedRef.current) return
      setSubmitted(true)
      setMessage('')
      closeTimerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return
        setSubmitted(false)
        setOpen(false)
      }, 1500)
    } catch {
      if (mountedRef.current) setSendError(true)
    } finally {
      if (mountedRef.current) setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-30 inline-flex items-center gap-2 rounded-full border border-forest-700/20 bg-forest-700 px-4 py-2.5 text-xs font-medium text-ivory shadow-lg transition hover:bg-forest-800"
      >
        <span aria-hidden="true">💬</span>
        <span>{isUk ? 'Залишити відгук' : 'Leave feedback'}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isUk ? 'Залишити відгук' : 'Leave feedback'}
          className="fixed inset-0 z-40 flex items-end justify-center bg-forest-950/40 p-4 sm:items-center"
        >
          <div className="w-full max-w-md rounded-3xl border border-beige bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-forest-800">
                {isUk ? 'Ваш відгук про Vazon' : 'Share feedback on Vazon'}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-forest-700 hover:bg-ivory"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <p className="mt-4 rounded-2xl bg-sage-100 px-4 py-3 text-sm font-medium text-forest-800">
                {isUk ? 'Дякуємо! Ваш відгук збережено.' : 'Thank you! Your feedback has been recorded.'}
              </p>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
                <div>
                  <p id="feedback-category-label" className="text-xs font-medium text-forest-800">
                    {t('feedback.categoryLabel')}
                  </p>
                  <div role="group" aria-labelledby="feedback-category-label" className="mt-1.5 flex gap-1.5">
                    {CATEGORIES.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={category === option.value}
                        onClick={() => setCategory(option.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          category === option.value
                            ? 'bg-forest-700 text-ivory'
                            : 'border border-beige-dark bg-ivory/50 text-forest-700'
                        }`}
                      >
                        {t(option.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-forest-800">
                    {isUk ? 'Оцінка зручності' : 'Experience rating'}
                  </p>
                  <div className="mt-1.5 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          rating >= star
                            ? 'bg-forest-700 text-ivory'
                            : 'border border-beige-dark bg-ivory/50 text-forest-700'
                        }`}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="feedback-message" className="block text-xs font-medium text-forest-800">
                    {isUk ? 'Що сподобалось або що варто покращити?' : 'What works well or could be improved?'}
                  </label>
                  <textarea
                    id="feedback-message"
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isUk ? 'Напишіть кілька слів...' : 'Tell us what you think...'}
                    className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
                  />
                </div>

                {sendError && (
                  <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {t('feedback.sendFailed')}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-beige-dark bg-white px-4 py-2 text-xs font-medium text-forest-800 hover:bg-ivory"
                  >
                    {isUk ? 'Скасувати' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-full bg-forest-700 px-5 py-2 text-xs font-medium text-ivory hover:bg-forest-800"
                  >
                    {sending ? t('feedback.sending') : isUk ? 'Надіслати' : 'Send feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
