import { useEffect, useState } from 'react'
import { fetchHealth } from '../services/healthService'
import type { HealthResponse } from '../types/api'

export type BackendHealthState =
  | { status: 'loading' }
  | { status: 'online'; data: HealthResponse }
  | { status: 'offline'; error: string }

/** Calls GET /health once on mount. Used to show that frontend and backend are connected. */
export function useBackendHealth(): BackendHealthState {
  const [state, setState] = useState<BackendHealthState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    fetchHealth(controller.signal)
      .then((data) => setState({ status: 'online', data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: 'offline',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      })
    return () => controller.abort()
  }, [])

  return state
}
