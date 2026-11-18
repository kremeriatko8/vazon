import { useEffect, useRef } from 'react'

export interface ToastMessage {
  /** Changes on every new message, so the same text shown twice restarts the timer. */
  id: number
  text: string
  tone: 'success' | 'error'
}

interface ActionToastProps {
  toast: ToastMessage | null
  onDismiss: () => void
  durationMs?: number
}

/** Short confirmation shown at the top of the screen after a care action. */
export function ActionToast({ toast, onDismiss, durationMs = 3000 }: ActionToastProps) {
  const dismissRef = useRef(onDismiss)
  useEffect(() => {
    dismissRef.current = onDismiss
  })

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => dismissRef.current(), durationMs)
    return () => window.clearTimeout(timer)
  }, [toast, durationMs])

  return (
    // The live region stays mounted so screen readers announce each new message.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      {toast && (
        <p
          key={toast.id}
          className={`pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.tone === 'error'
              ? 'border border-red-200 bg-red-50 text-red-800'
              : 'bg-forest-700 text-ivory'
          }`}
        >
          {toast.text}
        </p>
      )}
    </div>
  )
}
