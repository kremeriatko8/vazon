import { ApiError, apiClient } from './apiClient'
import type { CareActionType, CareLog } from '../types/plant'

export async function getPlantCareLogs(plantId: string): Promise<CareLog[]> {
  return apiClient.get<CareLog[]>(`/plants/${plantId}/care-history`)
}

export async function logCareAction(
  plantId: string,
  actionType: CareActionType,
  notes?: string,
  confirm = false,
): Promise<CareLog> {
  return apiClient.post<CareLog>(`/plants/${plantId}/care-history`, {
    actionType,
    ...(notes?.trim() ? { notes: notes.trim() } : {}),
    ...(confirm ? { confirm: true } : {}),
  })
}

export async function getAllCareLogs(): Promise<CareLog[]> {
  return apiClient.get<CareLog[]>('/care-history')
}

/** Body of 409 TOO_EARLY: watering or feeding sooner than the schedule allows. */
export interface TooEarlyDetails {
  lastDoneAt: string
  nextDueDate: string
}

/** The 409 code the backend sent (TOO_EARLY or ALREADY_LOGGED_TODAY), if any. */
export function conflictCode(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null
  const code = (error.body as { code?: unknown } | undefined)?.code
  return typeof code === 'string' ? code : null
}

export function tooEarlyDetails(error: unknown): TooEarlyDetails | null {
  if (conflictCode(error) !== 'TOO_EARLY') return null
  const body = (error as ApiError).body as Partial<TooEarlyDetails> | undefined
  if (typeof body?.lastDoneAt !== 'string' || typeof body.nextDueDate !== 'string') return null
  return { lastDoneAt: body.lastDoneAt, nextDueDate: body.nextDueDate }
}
