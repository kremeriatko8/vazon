import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ActionToast, type ToastMessage } from '../components/ActionToast'
import { careSuccessText, errorToast, successToast } from '../components/careActionMessages'
import { useAuth } from '../hooks/useAuth'
import { getAllCareLogs, logCareAction } from '../services/careLogService'
import { getPlants } from '../services/plantService'
import { buildCareTasks, snoozeWatering, type CareTask } from '../services/scheduleService'
import type { CareLog, Plant } from '../types/plant'

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const isUk = i18n.language === 'uk'
  const { user } = useAuth()
  const [plants, setPlants] = useState<Plant[]>([])
  const [logs, setLogs] = useState<CareLog[]>([])
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingKind, setPendingKind] = useState<'complete' | 'snooze' | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getPlants(), getAllCareLogs()])
      .then(([plantList, careLogs]) => {
        if (!cancelled) {
          setPlants(plantList)
          setLogs(careLogs)
          setTasks(buildCareTasks(plantList, careLogs))
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load dashboard.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleComplete(task: CareTask) {
    setCompletingId(task.id)
    setPendingKind('complete')
    setError(null)
    try {
      await logCareAction(task.plantId, task.action)
      const [plantList, careLogs] = await Promise.all([getPlants(), getAllCareLogs()])
      const nextTasks = buildCareTasks(plantList, careLogs)
      setPlants(plantList)
      setLogs(careLogs)
      setTasks(nextTasks)
      const nextWatering =
        task.action === 'WATERED'
          ? nextTasks.find((next) => next.plantId === task.plantId && next.action === 'WATERED')?.dueDate
          : undefined
      setToast(successToast(careSuccessText(t, task.action, task.plantName, nextWatering)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record care action.')
      setToast(errorToast(t))
    } finally {
      setCompletingId(null)
      setPendingKind(null)
    }
  }

  async function handleSnooze(task: CareTask) {
    const plant = plants.find((p) => p.id === task.plantId)
    if (!plant) return
    setCompletingId(task.id)
    setPendingKind('snooze')
    setError(null)
    try {
      await logCareAction(plant.id, 'SOIL_WET')
      const lastWatered =
        logs.find((l) => l.plantId === plant.id && l.actionType === 'WATERED')?.actionDate ?? plant.createdAt
      snoozeWatering(plant.id, lastWatered, 2)
      setTasks(buildCareTasks(plants, logs))
      setToast(successToast(careSuccessText(t, 'SOIL_WET', plant.name)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to postpone watering.')
      setToast(errorToast(t))
    } finally {
      setCompletingId(null)
      setPendingKind(null)
    }
  }

  const overdueCount = tasks.filter((t) => t.status === 'OVERDUE').length
  const dueTodayCount = tasks.filter((t) => t.status === 'TODAY').length
  const urgentTasks = tasks.filter((t) => t.status !== 'UPCOMING').slice(0, 4)

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <ActionToast toast={toast} onDismiss={() => setToast(null)} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">{t('dashboard.overview')}</p>
          <h1 className="mt-1 truncate font-display text-3xl font-semibold text-forest-800">
            {t('dashboard.welcome')}{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/plants/new"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-forest-700 px-4 py-2.5 text-xs font-medium whitespace-nowrap text-ivory transition hover:bg-forest-800"
          >
            {t('dashboard.addPlant')}
          </Link>
          <Link
            to="/tasks"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-beige-dark bg-white px-4 py-2.5 text-xs font-medium whitespace-nowrap text-forest-800 transition hover:bg-ivory"
          >
            {t('dashboard.fullSchedule')}
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-forest-700/75">Loading garden summary...</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-beige bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-forest-700/70">{t('dashboard.totalPlants')}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-forest-800">{plants.length}</p>
              <Link to="/plants" className="mt-3 inline-block text-xs font-medium text-forest-700 hover:underline">
                {t('dashboard.viewCollection')}
              </Link>
            </div>

            <div className="rounded-3xl border border-beige bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-forest-700/70">{t('dashboard.dueToday')}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-amber-800">{dueTodayCount}</p>
              <p className="mt-3 text-xs text-forest-700/70">{t('dashboard.scheduledToday')}</p>
            </div>

            <div className="rounded-3xl border border-beige bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-forest-700/70">{t('dashboard.overdue')}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-red-700">{overdueCount}</p>
              <p className="mt-3 text-xs text-forest-700/70">{t('dashboard.needsPromptCare')}</p>
            </div>
          </div>

          {plants.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl font-semibold text-forest-800">
                  {isUk ? 'Ваші рослини сьогодні' : 'Your plants today'}
                </h2>
                <Link to="/plants" className="text-xs font-medium text-forest-700 hover:underline">
                  {t('dashboard.viewCollection')}
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plants.slice(0, 6).map((plant) => {
                  const plantTask = tasks.find((tk) => tk.plantId === plant.id)
                  const isOverdue = plantTask?.status === 'OVERDUE'
                  const isToday = plantTask?.status === 'TODAY'
                  const statusText = isOverdue
                    ? isUk
                      ? 'Потрібен полив (прострочено)'
                      : 'Needs water (overdue)'
                    : isToday
                      ? isUk
                        ? 'Полити сьогодні'
                        : 'Water today'
                      : isUk
                        ? `Наступний полив через ${plantTask?.daysUntilDue ?? 7} дн.`
                        : `Next water in ${plantTask?.daysUntilDue ?? 7}d`

                  const statusClass = isOverdue
                    ? 'bg-red-100 text-red-800'
                    : isToday
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-sage-100 text-forest-800'

                  return (
                    <Link
                      key={plant.id}
                      to={`/plants/${plant.id}`}
                      className="group flex items-center gap-3.5 rounded-2xl border border-beige bg-white p-3.5 shadow-sm transition hover:border-forest-600/40"
                    >
                      {plant.photoUrl ? (
                        <img
                          src={plant.photoUrl}
                          alt={plant.name}
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-xl">
                          🌿
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base font-semibold text-forest-800 group-hover:underline">
                          {plant.name}
                        </p>
                        <p className="truncate text-xs italic text-forest-700/70">{plant.species}</p>
                        <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-beige bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-forest-800">{t('dashboard.needsAttention')}</h2>
              <Link to="/tasks" className="text-xs font-medium text-forest-700 hover:underline">
                {t('dashboard.seeAll', { count: tasks.length })}
              </Link>
            </div>

            {urgentTasks.length === 0 ? (
              <p className="mt-4 text-sm text-forest-700/75">{t('dashboard.allHappy')}</p>
            ) : (
              <ul className="mt-4 divide-y divide-beige/70">
                {urgentTasks.map((task) => (
                  <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            task.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {task.status === 'OVERDUE'
                            ? `${Math.abs(task.daysUntilDue)}d overdue`
                            : t('dashboard.dueToday')}
                        </span>
                        <span className="text-xs text-forest-700/80">
                          {task.action === 'WATERED' ? 'Water' : 'Feed'}
                        </span>
                      </div>
                      <Link
                        to={`/plants/${task.plantId}`}
                        className="mt-1 inline-block font-display text-base font-semibold text-forest-800 hover:underline"
                      >
                        {task.plantName}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.action === 'WATERED' && (
                        <button
                          type="button"
                          title={t('care.checkAgainHint')}
                          disabled={completingId === task.id}
                          onClick={() => void handleSnooze(task)}
                          className="rounded-full border border-beige-dark bg-ivory/60 px-3 py-1.5 text-xs font-medium text-forest-800 transition hover:bg-beige/60 disabled:opacity-60"
                        >
                          {completingId === task.id && pendingKind === 'snooze'
                            ? t('care.saving')
                            : t('dashboard.soilStillWet')}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={completingId === task.id}
                        onClick={() => void handleComplete(task)}
                        className="rounded-full bg-forest-700 px-3.5 py-1.5 text-xs font-medium text-ivory transition hover:bg-forest-800 disabled:opacity-60"
                      >
                        {completingId === task.id && pendingKind === 'complete'
                          ? t('care.saving')
                          : t(task.action === 'WATERED' ? 'care.markWatered' : 'care.markFed')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}
