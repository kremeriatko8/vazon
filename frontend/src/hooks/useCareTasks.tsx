import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ToastMessage } from '../components/ActionToast'
import { careSuccessText, errorToast, successToast } from '../components/careActionMessages'
import { getCareTasks, type CareTask } from '../services/scheduleService'
import { AlreadyLoggedTodayError, useCareRecorder } from './useCareRecorder'

/**
 * Care tasks from GET /care-tasks, with "done" and "soil still wet" actions.
 * Shared by the dashboard and the Tasks page.
 */
export function useCareTasks() {
  const { t } = useTranslation()
  const { record, dialog } = useCareRecorder()
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyKind, setBusyKind] = useState<'complete' | 'snooze' | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    let cancelled = false
    getCareTasks()
      .then((list) => {
        if (!cancelled) setTasks(list)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('care.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const run = useCallback(
    async (task: CareTask, kind: 'complete' | 'snooze') => {
      setBusyId(task.id)
      setBusyKind(kind)
      setError(null)
      try {
        const created = await record(task.plantId, kind === 'complete' ? task.action : 'SOIL_WET')
        if (!created) return
        const next = await getCareTasks()
        setTasks(next)
        if (kind === 'snooze') {
          setToast(successToast(t('care.toast.soilWet')))
          return
        }
        const nextWater =
          task.action === 'WATERED'
            ? next.find((n) => n.plantId === task.plantId && n.action === 'WATERED')?.dueDate
            : undefined
        setToast(
          successToast(
            careSuccessText(t, task.action, task.plantName, nextWater ? `${nextWater}T12:00:00Z` : undefined),
          ),
        )
      } catch (err) {
        if (err instanceof AlreadyLoggedTodayError) {
          setToast(successToast(t('care.toast.alreadyChecked', { plant: task.plantName })))
          return
        }
        setError(err instanceof Error ? err.message : t('care.toast.saveFailed'))
        setToast(errorToast(t))
      } finally {
        setBusyId(null)
        setBusyKind(null)
      }
    },
    [record, t],
  )

  return {
    tasks,
    loading,
    error,
    toast,
    dismissToast: () => setToast(null),
    complete: (task: CareTask) => run(task, 'complete'),
    soilStillWet: (task: CareTask) => run(task, 'snooze'),
    isBusy: (task: CareTask, kind: 'complete' | 'snooze') => busyId === task.id && busyKind === kind,
    isDisabled: (task: CareTask) => busyId === task.id,
    dialog,
  }
}
