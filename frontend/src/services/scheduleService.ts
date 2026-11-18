import { apiClient } from './apiClient'
import type { CareActionType } from '../types/plant'

export type TaskStatus = 'OVERDUE' | 'TODAY' | 'UPCOMING'

/** One item of GET /api/v1/care-tasks (computed by the backend schedule engine). */
export interface ApiScheduledTask {
  plantId: string
  plantName: string
  species: string
  taskType: 'WATER' | 'FEED'
  lastDoneAt: string | null
  /** Due day in Europe/Kyiv, YYYY-MM-DD. */
  nextDueDate: string
  intervalDays: number
  status: TaskStatus
  waterAmountMl?: { min: number; max: number } | null
}

export interface CareTask {
  id: string
  plantId: string
  plantName: string
  species: string
  action: Extract<CareActionType, 'WATERED' | 'FED'>
  /** Due day, YYYY-MM-DD (Europe/Kyiv). */
  dueDate: string
  /** Negative when overdue. */
  daysUntilDue: number
  status: TaskStatus
  intervalDays: number
  waterAmountMl: { min: number; max: number } | null
}

/** Today's date in Europe/Kyiv as YYYY-MM-DD, the time zone the backend uses for due days. */
export function kyivToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Whole days from `from` to `to`, both YYYY-MM-DD. */
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

export function toCareTask(task: ApiScheduledTask, now = new Date()): CareTask {
  return {
    id: `${task.plantId}-${task.taskType}`,
    plantId: task.plantId,
    plantName: task.plantName,
    species: task.species,
    action: task.taskType === 'WATER' ? 'WATERED' : 'FED',
    dueDate: task.nextDueDate,
    daysUntilDue: daysBetween(kyivToday(now), task.nextDueDate),
    status: task.status,
    intervalDays: task.intervalDays,
    waterAmountMl: task.waterAmountMl ?? null,
  }
}

/** The user's care tasks, soonest first (the backend sorts them). */
export async function getCareTasks(now = new Date()): Promise<CareTask[]> {
  const tasks = await apiClient.get<ApiScheduledTask[]>('/care-tasks')
  return tasks.map((task) => toCareTask(task, now))
}

/** "300–500" (the unit is added by the translation), or null when the backend gave no amount. */
export function formatWaterAmount(amount: CareTask['waterAmountMl']): string | null {
  if (!amount) return null
  return amount.min === amount.max ? `${amount.min}` : `${amount.min}–${amount.max}`
}
