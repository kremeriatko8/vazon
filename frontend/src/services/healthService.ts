import type { HealthResponse } from '../types/api'
import { apiClient } from './apiClient'

export function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/health', { signal })
}
