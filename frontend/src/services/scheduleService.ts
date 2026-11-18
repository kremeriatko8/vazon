import type { CareActionType, CareLog, Plant } from '../types/plant'

export type TaskStatus = 'OVERDUE' | 'TODAY' | 'UPCOMING'

export interface CareTask {
  id: string
  plantId: string
  plantName: string
  location: string | null
  action: Extract<CareActionType, 'WATERED' | 'FED'>
  dueDate: string
  daysUntilDue: number
  status: TaskStatus
}

const MS_PER_DAY = 1000 * 60 * 60 * 24
const DEFAULT_WATERING_DAYS = 7
const SNOOZE_STORAGE_KEY = 'vazon_water_snoozes'

type SnoozeMap = Record<string, { snoozedUntil: string; baselineWateredAt: string }>

function loadSnoozes(): SnoozeMap {
  try {
    const raw = localStorage.getItem(SNOOZE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SnoozeMap) : {}
  } catch {
    return {}
  }
}

function saveSnoozes(map: SnoozeMap): void {
  localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(map))
}

export function snoozeWatering(plantId: string, baselineWateredAt: string, days = 2, now = new Date()): void {
  const current = loadSnoozes()
  const target = new Date(startOfDay(now).getTime() + days * MS_PER_DAY)
  current[plantId] = {
    snoozedUntil: target.toISOString(),
    baselineWateredAt,
  }
  saveSnoozes(current)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function computeStatus(daysUntilDue: number): TaskStatus {
  if (daysUntilDue < 0) return 'OVERDUE'
  if (daysUntilDue === 0) return 'TODAY'
  return 'UPCOMING'
}

export function buildCareTasks(plants: Plant[], logs: CareLog[], now = new Date()): CareTask[] {
  const today = startOfDay(now)
  const snoozes = loadSnoozes()
  const tasks: CareTask[] = []

  for (const plant of plants) {
    const plantLogs = logs.filter((l) => l.plantId === plant.id)
    const wateringDays = plant.wateringIntervalDays ?? DEFAULT_WATERING_DAYS

    const lastWatered = plantLogs.find((l) => l.actionType === 'WATERED')?.actionDate ?? plant.createdAt
    let waterDue = new Date(startOfDay(new Date(lastWatered)).getTime() + wateringDays * MS_PER_DAY)

    const activeSnooze = snoozes[plant.id]
    if (activeSnooze && activeSnooze.baselineWateredAt === lastWatered) {
      const snoozedDate = startOfDay(new Date(activeSnooze.snoozedUntil))
      if (snoozedDate.getTime() > waterDue.getTime()) {
        waterDue = snoozedDate
      }
    }

    const waterDays = Math.round((waterDue.getTime() - today.getTime()) / MS_PER_DAY)

    tasks.push({
      id: `${plant.id}-water`,
      plantId: plant.id,
      plantName: plant.name,
      location: plant.location ?? null,
      action: 'WATERED',
      dueDate: waterDue.toISOString(),
      daysUntilDue: waterDays,
      status: computeStatus(waterDays),
    })

    if (plant.fertilizingIntervalDays) {
      const lastFed = plantLogs.find((l) => l.actionType === 'FED')?.actionDate ?? plant.createdAt
      const fedDue = new Date(startOfDay(new Date(lastFed)).getTime() + plant.fertilizingIntervalDays * MS_PER_DAY)
      const fedDays = Math.round((fedDue.getTime() - today.getTime()) / MS_PER_DAY)

      tasks.push({
        id: `${plant.id}-feed`,
        plantId: plant.id,
        plantName: plant.name,
        location: plant.location ?? null,
        action: 'FED',
        dueDate: fedDue.toISOString(),
        daysUntilDue: fedDays,
        status: computeStatus(fedDays),
      })
    }
  }

  return tasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
}
