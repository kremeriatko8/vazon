import { useEffect, useRef } from 'react'

export interface ConfirmRequest {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  resolve: (confirmed: boolean) => void
}

/** In-page confirmation dialog; opened through useConfirmDialog. */
export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest; onClose: (confirmed: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-900/30 p-4 sm:items-center">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-sm rounded-3xl border border-beige bg-white p-6 shadow-xl"
      >
        <h2 id="confirm-title" className="font-display text-lg font-semibold text-forest-800">
          {request.title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-forest-700/85">
          {request.message}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onClose(false)}
            className="rounded-full border border-beige-dark bg-white px-4 py-2 text-sm font-medium text-forest-800 transition hover:bg-ivory"
          >
            {request.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            className="rounded-full bg-forest-700 px-4 py-2 text-sm font-medium text-ivory transition hover:bg-forest-800"
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
