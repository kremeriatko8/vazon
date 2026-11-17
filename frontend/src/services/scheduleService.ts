import type { CareActionType, CareLog, Plant } from '../types/plant'

export type TaskStatus = 'OVERDUE' | 'TODAY' | 'UPCOMING'

export interface CareTask {
  id: string
  plantId: string
  plantName: string
  location: string | null
  action: Extract<CareActionType, 'WATERED' | 'FERTILIZED'>
  dueDate: string
  daysUntilDue: number
  status: TaskStatus
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

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
  const tasks: CareTask[] = []

  for (const plant of plants) {
    const plantLogs = logs.filter((l) => l.plantId === plant.id)

    const lastWatered = plantLogs.find((l) => l.action === 'WATERED')?.performedAt ?? plant.createdAt
    const waterDue = new Date(startOfDay(new Date(lastWatered)).getTime() + plant.wateringIntervalDays * MS_PER_DAY)
    const waterDays = Math.round((waterDue.getTime() - today.getTime()) / MS_PER_DAY)

    tasks.push({
      id: `${plant.id}-water`,
      plantId: plant.id,
      plantName: plant.name,
      location: plant.location,
      action: 'WATERED',
      dueDate: waterDue.toISOString(),
      daysUntilDue: waterDays,
      status: computeStatus(waterDays),
    })

    if (plant.fertilizingIntervalDays) {
      const lastFed = plantLogs.find((l) => l.action === 'FERTILIZED')?.performedAt ?? plant.createdAt
      const fedDue = new Date(startOfDay(new Date(lastFed)).getTime() + plant.fertilizingIntervalDays * MS_PER_DAY)
      const fedDays = Math.round((fedDue.getTime() - today.getTime()) / MS_PER_DAY)

      tasks.push({
        id: `${plant.id}-fertilize`,
        plantId: plant.id,
        plantName: plant.name,
        location: plant.location,
        action: 'FERTILIZED',
        dueDate: fedDue.toISOString(),
        daysUntilDue: fedDays,
        status: computeStatus(fedDays),
      })
    }
  }

  return tasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
}
