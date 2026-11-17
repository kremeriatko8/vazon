import { useBackendHealth } from '../hooks/useBackendHealth'
import { API_BASE_URL } from '../services/apiClient'

/** Shows the live result of GET /health so developers can see the stack is wired together. */
export function BackendStatus() {
  const health = useBackendHealth()

  const dot =
    health.status === 'online'
      ? 'bg-sage-500'
      : health.status === 'offline'
        ? 'bg-amber-500'
        : 'bg-beige-dark animate-pulse'

  return (
    <div
      className="rounded-2xl border border-beige bg-white p-5 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        <p className="font-medium text-forest-800">
          {health.status === 'loading' && 'Checking the API…'}
          {health.status === 'online' && 'API connected'}
          {health.status === 'offline' && 'API not reachable'}
        </p>
      </div>
      <p className="mt-2 break-all text-xs text-forest-700/70">
        GET {API_BASE_URL}/health
        {health.status === 'online' && ` → status "${health.data.status}"`}
        {health.status === 'offline' && ` → ${health.error}`}
      </p>
    </div>
  )
}
