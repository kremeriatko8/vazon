import { apiClient } from './apiClient'
import type { CareActionType, CareLog } from '../types/plant'

export async function getPlantCareLogs(plantId: string): Promise<CareLog[]> {
  return apiClient.get<CareLog[]>(`/plants/${plantId}/care-history`)
}

export async function logCareAction(
  plantId: string,
  actionType: CareActionType,
  notes?: string,
): Promise<CareLog> {
  return apiClient.post<CareLog>(`/plants/${plantId}/care-history`, {
    actionType,
    ...(notes?.trim() ? { notes: notes.trim() } : {}),
  })
}

export async function getAllCareLogs(): Promise<CareLog[]> {
  return apiClient.get<CareLog[]>('/care-history')
}
