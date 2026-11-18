import { useCallback, useState } from 'react'
import { ConfirmDialog, type ConfirmRequest } from '../components/ConfirmDialog'

/**
 * An in-page confirmation dialog (no window.confirm). Returns a function that
 * opens it and resolves to true or false, plus the element to render.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)

  const confirm = useCallback(
    (options: Omit<ConfirmRequest, 'resolve'>) =>
      new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    [],
  )

  const close = (confirmed: boolean) => {
    request?.resolve(confirmed)
    setRequest(null)
  }

  const dialog = request ? <ConfirmDialog request={request} onClose={close} /> : null
  return { confirm, dialog }
}

