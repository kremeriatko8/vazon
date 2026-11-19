import type { TFunction } from 'i18next'
import type { CareTask } from '../services/scheduleService'
import type { CareActionType } from '../types/plant'
import type { ToastMessage } from './ActionToast'

let lastToastId = 0

/** Dates in care messages: DD.MM.YYYY in Europe/Kyiv. */
export function formatCareDate(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

/** Confirmation text for a successful care action. */
export function careSuccessText(
  t: TFunction,
  action: CareActionType,
  plantName: string,
  nextWateringIso?: string,
): string {
  switch (action) {
    case 'WATERED':
      return nextWateringIso
        ? t('care.toast.wateredNext', { plant: plantName, date: formatCareDate(nextWateringIso) })
        : t('care.toast.watered', { plant: plantName })
    case 'FED':
      return t('care.toast.fed', { plant: plantName })
    case 'REPOTTED':
      return t('care.toast.repotted', { plant: plantName })
    case 'SOIL_WET':
      return t('care.toast.soilWet')
  }
}

export function successToast(text: string): ToastMessage {
  return { id: ++lastToastId, text, tone: 'success' }
}

export function errorToast(t: TFunction): ToastMessage {
  return { id: ++lastToastId, text: t('care.toast.saveFailed'), tone: 'error' }
}

/** "3 days overdue", "Due today" or "In 2 days". */
export function dueLabel(t: TFunction, task: CareTask): string {
  if (task.status === 'OVERDUE') return t('tasks.overdueDays', { count: Math.max(1, -task.daysUntilDue) })
  if (task.status === 'TODAY') return t('tasks.dueToday')
  return t('tasks.inDays', { count: Math.max(1, task.daysUntilDue) })
}
