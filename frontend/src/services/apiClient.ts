import type { ApiErrorBody } from '../types/api'

/**
 * Central HTTP client for the Vazon API.
 * Every request to the backend must go through this module so that the base URL,
 * headers and error handling live in one place.
 */

const DEFAULT_API_URL = 'http://localhost:3100/api/v1'

export function resolveApiBaseUrl(configured: string | undefined): string {
  const value = configured?.trim() || DEFAULT_API_URL
  return value.replace(/\/+$/, '')
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL)

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | undefined

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export function buildUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(buildUrl(API_BASE_URL, path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    let body: ApiErrorBody | undefined
    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      body = undefined
    }
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? response.statusText)
    throw new ApiError(response.status, message, body)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export const apiClient = {
  get: <T>(path: string, init?: RequestInit) => apiRequest<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, data: unknown, init?: RequestInit) =>
    apiRequest<T>(path, { ...init, method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown, init?: RequestInit) =>
    apiRequest<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(path: string, init?: RequestInit) =>
    apiRequest<T>(path, { ...init, method: 'DELETE' }),
}
