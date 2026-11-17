import { apiClient } from './apiClient'
import type { CareActionType, CareLog } from '../types/plant'

const LOGS_KEY = 'vazon_care_logs'
const USE_MOCK = import.meta.env.VITE_USE_MOCK_PLANTS !== 'false'

const seedLogs: CareLog[] = [
  {
    id: 'log-1',
    plantId: 'plant-1',
    action: 'WATERED',
    performedAt: '2026-11-12T09:00:00.000Z',
    note: 'Filtered room-temperature water.',
  },
  {
    id: 'log-2',
    plantId: 'plant-1',
    action: 'FERTILIZED',
    performedAt: '2026-10-25T10:30:00.000Z',
    note: 'Half-strength liquid fertilizer.',
  },
  {
    id: 'log-3',
    plantId: 'plant-2',
    action: 'WATERED',
    performedAt: '2026-11-05T18:00:00.000Z',
    note: null,
  },
]

function loadMockLogs(): CareLog[] {
  const raw = localStorage.getItem(LOGS_KEY)
  if (!raw) {
    localStorage.setItem(LOGS_KEY, JSON.stringify(seedLogs))
    return seedLogs
  }
  return JSON.parse(raw) as CareLog[]
}

export async function getPlantCareLogs(plantId: string): Promise<CareLog[]> {
  if (!USE_MOCK) return apiClient.get<CareLog[]>(`/plants/${plantId}/care-logs`)
  return loadMockLogs()
    .filter((log) => log.plantId === plantId)
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt))
}

export async function logCareAction(
  plantId: string,
  action: CareActionType,
  note?: string,
): Promise<CareLog> {
  if (!USE_MOCK) {
    return apiClient.post<CareLog>(`/plants/${plantId}/care-logs`, { action, note })
  }
  const entry: CareLog = {
    id: crypto.randomUUID(),
    plantId,
    action,
    performedAt: new Date().toISOString(),
    note: note?.trim() || null,
  }
  const updated = [entry, ...loadMockLogs()]
  localStorage.setItem(LOGS_KEY, JSON.stringify(updated))
  return entry
}

export async function getAllCareLogs(): Promise<CareLog[]> {
  if (!USE_MOCK) return apiClient.get<CareLog[]>('/care-logs')
  return loadMockLogs().sort((a, b) => b.performedAt.localeCompare(a.performedAt))
}
