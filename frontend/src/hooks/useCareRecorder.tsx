import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfirmDialog } from './useConfirmDialog'
import { formatCareDate } from '../components/careActionMessages'
import { conflictCode, logCareAction, tooEarlyDetails } from '../services/careLogService'
import { daysBetween, kyivToday } from '../services/scheduleService'
import type { CareActionType, CareLog } from '../types/plant'

/** Thrown when the soil was already checked today for this plant (409 ALREADY_LOGGED_TODAY). */
export class AlreadyLoggedTodayError extends Error {
  constructor() {
    super('Already logged today')
    this.name = 'AlreadyLoggedTodayError'
  }
}

/**
 * Records a care action. If the backend answers 409 TOO_EARLY ("watered
 * yesterday"), asks the user and repeats with confirm: true.
 * Resolves to null when the user cancels.
 */
export function useCareRecorder() {
  const { t } = useTranslation()
  const { confirm, dialog } = useConfirmDialog()

  const record = useCallback(
    async (plantId: string, action: CareActionType, notes?: string): Promise<CareLog | null> => {
      try {
        return await logCareAction(plantId, action, notes)
      } catch (error) {
        if (conflictCode(error) === 'ALREADY_LOGGED_TODAY') throw new AlreadyLoggedTodayError()
        const details = tooEarlyDetails(error)
        if (!details) throw error

        const lastDay = kyivToday(new Date(details.lastDoneAt))
        const daysAgo = daysBetween(lastDay, kyivToday())
        const when =
          daysAgo <= 0 ? t('care.tooEarly.today') : daysAgo === 1 ? t('care.tooEarly.yesterday') : t('care.tooEarly.daysAgo', { count: daysAgo })
        const isWater = action === 'WATERED'
        const ok = await confirm({
          title: t(isWater ? 'care.tooEarly.titleWater' : 'care.tooEarly.titleFeed', { when }),
          message: t('care.tooEarly.message', { date: formatCareDate(`${details.nextDueDate}T12:00:00Z`) }),
          confirmLabel: t('care.tooEarly.confirm'),
          cancelLabel: t('care.tooEarly.cancel'),
        })
        if (!ok) return null
        return logCareAction(plantId, action, notes, true)
      }
    },
    [confirm, t],
  )

  return { record, dialog }
}
