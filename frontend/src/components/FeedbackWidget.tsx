import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { sendFeedback, type FeedbackCategory } from '../services/feedbackService'

const CATEGORIES: { value: FeedbackCategory; labelKey: string }[] = [
  { value: 'BUG', labelKey: 'feedback.categoryBug' },
  { value: 'IDEA', labelKey: 'feedback.categoryIdea' },
  { value: 'OTHER', labelKey: 'feedback.categoryOther' },
]

/** Backend limits for POST /feedback. */
const MAX_PAGE_LENGTH = 200
/** The API allows 2000 characters; this leaves room for the "Rating: N/5" prefix. */
const MAX_MESSAGE_LENGTH = 1900

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

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-[14px] font-medium transition ${
      active ? 'bg-[var(--olive)] text-white' : 'border border-[#d9ddd5] bg-white text-[var(--forest)]'
    }`

  return (
    <>
      <button type="button" className="feedback-button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <MessageCircle size={15} aria-hidden="true" /> {isUk ? 'Залишити відгук' : 'Leave feedback'}
      </button>

      {open && (
        <div className="feedback-popover" role="dialog" aria-label={isUk ? 'Залишити відгук' : 'Leave feedback'}>
          <button type="button" aria-label={isUk ? 'Закрити' : 'Close'} onClick={() => setOpen(false)}>
            <X size={17} />
          </button>
          <strong>{isUk ? 'Як вам Vazon?' : 'How does Vazon feel?'}</strong>
          <p>
            {isUk
              ? 'Ми читаємо кожен відгук. Розкажіть, що зробило б догляд за рослинами ще спокійнішим.'
              : 'We read every note. Tell us what would make plant care feel even calmer.'}
          </p>

          {submitted ? (
            <p role="status" className="rounded-xl bg-[var(--mint)] px-3 py-2.5 text-[14px] font-medium text-[var(--forest)]">
              {isUk ? 'Дякуємо! Ваш відгук збережено.' : 'Thank you! Your feedback has been recorded.'}
            </p>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div role="group" aria-label={t('feedback.categoryLabel')} className="mb-2.5 flex flex-wrap gap-1.5">
                {CATEGORIES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={category === option.value}
                    onClick={() => setCategory(option.value)}
                    className={chip(category === option.value)}
                  >
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
              <div role="group" aria-label={isUk ? 'Оцінка зручності' : 'Experience rating'} className="mb-2.5 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-pressed={rating === star}
                    aria-label={`${star} / 5`}
                    onClick={() => setRating(star)}
                    className={`text-lg leading-none ${rating >= star ? 'text-[var(--olive)]' : 'text-[#cfd5ca]'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <label htmlFor="feedback-message" className="sr-only">
                {isUk ? 'Що сподобалось або що варто покращити?' : 'What works well or could be improved?'}
              </label>
              <textarea
                id="feedback-message"
                required
                maxLength={MAX_MESSAGE_LENGTH}
                aria-describedby="feedback-message-count"
                value={message}
                // maxLength does not cover every path (for example, scripted input), so cut here too.
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                placeholder={isUk ? 'Поділіться думками…' : 'Share your thoughts…'}
              />
              <p id="feedback-message-count" aria-live="polite" className="mt-1 text-right text-[13px] text-[#758077]">
                {t('feedback.charCount', { count: message.length, max: MAX_MESSAGE_LENGTH })}
              </p>
              {sendError && (
                <p role="alert" className="mt-1 text-[14px] text-red-700">
                  {t('feedback.sendFailed')}
                </p>
              )}
              <button type="submit" disabled={sending} className="app-button full">
                {sending ? t('feedback.sending') : isUk ? 'Надіслати відгук' : 'Send feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
