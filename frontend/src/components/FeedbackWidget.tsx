import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

export function FeedbackWidget() {
  const { i18n } = useTranslation()
  const isUk = i18n.language === 'uk'

  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<number>(5)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!message.trim()) return
    const existing = JSON.parse(localStorage.getItem('vazon_feedback') || '[]') as unknown[]
    localStorage.setItem(
      'vazon_feedback',
      JSON.stringify([
        { rating, message: message.trim(), createdAt: new Date().toISOString() },
        ...existing,
      ]),
    )
    setSubmitted(true)
    setMessage('')
    setTimeout(() => {
      setSubmitted(false)
      setOpen(false)
    }, 1500)
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
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                    className="rounded-full bg-forest-700 px-5 py-2 text-xs font-medium text-ivory hover:bg-forest-800"
                  >
                    {isUk ? 'Надіслати' : 'Send feedback'}
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
