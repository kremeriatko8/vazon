import { ArrowRight, Check, Droplets, Leaf, Plus, Sprout } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ActionToast } from '../components/ActionToast'
import { dueLabel } from '../components/careActionMessages'
import { useAuth } from '../hooks/useAuth'
import { useCareTasks } from '../hooks/useCareTasks'
import { getAllCareLogs } from '../services/careLogService'
import { getPlants } from '../services/plantService'
import { formatWaterAmount, kyivToday, type CareTask } from '../services/scheduleService'
import type { CareLog, Plant } from '../types/plant'

/** Morning, afternoon or evening in Europe/Kyiv. */
function greetingKey(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', hour: 'numeric', hour12: false }).format(now),
  )
  if (hour < 12) return 'dashboard.goodMorning'
  if (hour < 18) return 'dashboard.goodAfternoon'
  return 'dashboard.goodEvening'
}

function dateParts(locale: string, now = new Date()) {
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: 'Europe/Kyiv', ...options }).format(now)
  return {
    weekday: part({ weekday: 'short' }).replace('.', '').toUpperCase(),
    day: part({ day: 'numeric' }),
    month: part({ month: 'long' }).toUpperCase(),
  }
}

/** Waterings and feedings logged today (Europe/Kyiv). */
function doneTodayCount(logs: CareLog[]): number {
  const today = kyivToday()
  return logs.filter(
    (log) => (log.actionType === 'WATERED' || log.actionType === 'FED') && kyivToday(new Date(log.actionDate)) === today,
  ).length
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const care = useCareTasks()
  const [plants, setPlants] = useState<Plant[]>([])
  const [logs, setLogs] = useState<CareLog[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getPlants(), getAllCareLogs()])
      .then(([plantList, careLogs]) => {
        if (!cancelled) {
          setPlants(plantList)
          setLogs(careLogs)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setDataError(err instanceof Error ? err.message : t('dashboard.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false)
      })
    return () => {
      cancelled = true
    }
  }, [t])

  async function complete(task: CareTask) {
    await care.complete(task)
    getAllCareLogs()
      .then(setLogs)
      .catch(() => undefined)
  }

  const loading = loadingData || care.loading
  const error = dataError ?? care.error
  const dueTasks = care.tasks.filter((task) => task.status !== 'UPCOMING')
  const upcoming = care.tasks.filter((task) => task.status === 'UPCOMING').slice(0, 3)
  const done = doneTodayCount(logs)
  const total = done + dueTasks.length
  const progress = total === 0 ? 1 : done / total
  const name = user?.email ? user.email.split('@')[0] : ''
  const date = dateParts(i18n.language === 'uk' ? 'uk-UA' : 'en-GB')
  const spotlight = plants.find((plant) => plant.photoUrl) ?? plants[0]
  const waterTaskFor = (plantId: string) =>
    care.tasks.find((task) => task.plantId === plantId && task.action === 'WATERED')

  return (
    <>
      <ActionToast toast={care.toast} onDismiss={care.dismissToast} />
      {care.dialog}

      <section className="bg-forest-800 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-sage-300 uppercase">
                <span className="h-px w-6 bg-sage-300/60" /> {t('dashboard.kicker')}
              </p>
              <h1 className="mt-3 truncate font-display text-3xl font-medium sm:text-5xl">
                {t(greetingKey())}
                {name && (
                  <>
                    , <em className="text-sage-200">{name}.</em>
                  </>
                )}
              </h1>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-white/15 px-5 py-2.5 text-center">
              <span className="text-[11px] tracking-[0.18em] text-white/70">{date.weekday}</span>
              <strong className="font-display text-3xl leading-tight font-medium">{date.day}</strong>
              <small className="text-[11px] tracking-[0.18em] text-white/70">{date.month}</small>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
            <div className="rounded-3xl bg-ivory p-6 text-ink shadow-xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-forest-700/60 uppercase">
                    {t('dashboard.rhythm')}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-medium">
                    {loading
                      ? t('dashboard.loading')
                      : dueTasks.length === 0
                        ? t('dashboard.allDone')
                        : t('dashboard.reminders', { count: dueTasks.length })}
                  </h2>
                </div>
                <div
                  className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
                  style={
                    {
                      background: `conic-gradient(var(--color-olive-800) ${progress * 360}deg, var(--color-mint) 0)`,
                    } as CSSProperties
                  }
                  role="img"
                  aria-label={t('dashboard.progressLabel', { done, total })}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ivory text-sm font-semibold">
                    {done}/{total}
                  </span>
                </div>
              </div>

              {!loading && dueTasks.length > 0 && (
                <ul className="mt-6 space-y-2.5">
                  {dueTasks.slice(0, 5).map((task) => {
                    const Icon = task.action === 'WATERED' ? Droplets : Sprout
                    const amount = task.action === 'WATERED' ? formatWaterAmount(task.waterAmountMl) : null
                    return (
                      <li key={task.id} className="rounded-2xl border border-beige bg-white">
                        <button
                          type="button"
                          disabled={care.isDisabled(task)}
                          onClick={() => void complete(task)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-mint/40 disabled:opacity-60"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-olive-800">
                            <Icon size={19} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {t(task.action === 'WATERED' ? 'dashboard.waterPlant' : 'dashboard.feedPlant', {
                                plant: task.plantName,
                              })}
                            </span>
                            <span className="block text-xs text-forest-700/70">
                              {[amount && t('care.amountShort', { amount }), dueLabel(t, task)].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-forest-700/25 text-olive-800">
                            {care.isBusy(task, 'complete') ? '…' : <Check size={15} aria-hidden="true" />}
                            <span className="sr-only">
                              {t(task.action === 'WATERED' ? 'care.markWatered' : 'care.markFed')}
                            </span>
                          </span>
                        </button>
                        {task.action === 'WATERED' && (
                          <div className="border-t border-beige/70 px-4 py-1.5 text-right">
                            <button
                              type="button"
                              title={t('care.checkAgainHint')}
                              disabled={care.isDisabled(task)}
                              onClick={() => void care.soilStillWet(task)}
                              className="text-[11px] font-medium text-forest-700 hover:underline disabled:opacity-60"
                            >
                              {care.isBusy(task, 'snooze') ? t('care.saving') : t('dashboard.soilStillWet')}
                            </button>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}

              {!loading && dueTasks.length === 0 && upcoming.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-medium text-forest-700/70">{t('dashboard.comingUp')}</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {upcoming.map((task) => (
                      <li key={task.id} className="flex justify-between gap-3">
                        <span className="truncate">
                          {t(task.action === 'WATERED' ? 'dashboard.waterPlant' : 'dashboard.feedPlant', {
                            plant: task.plantName,
                          })}
                        </span>
                        <span className="shrink-0 text-forest-700/70">{dueLabel(t, task)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                to="/tasks"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-olive-800 px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-olive-900"
              >
                {t('dashboard.fullSchedule')} <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            {spotlight ? (
              <Link
                to={`/plants/${spotlight.id}`}
                className="group relative min-h-72 overflow-hidden rounded-3xl bg-forest-700 shadow-xl"
              >
                {spotlight.photoUrl ? (
                  <img
                    src={spotlight.photoUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-7xl" aria-hidden="true">
                    🌿
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-black/10 to-transparent p-6">
                  <span className="self-start rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] backdrop-blur">
                    {t('dashboard.spotlight')}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-medium">
                      {t('dashboard.meet', { plant: spotlight.name })}
                    </h3>
                    <p className="text-sm text-white/80 italic">{spotlight.species}</p>
                  </div>
                </div>
              </Link>
            ) : (
              !loading && (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/15 p-8 text-center">
                  <Sprout size={36} className="text-sage-200" aria-hidden="true" />
                  <p className="mt-4 font-display text-xl">{t('dashboard.emptyTitle')}</p>
                  <Link
                    to="/plants/new"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-ivory px-5 py-2.5 text-sm font-semibold text-forest-800"
                  >
                    {t('dashboard.addFirst')} <Plus size={16} aria-hidden="true" />
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {plants.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-olive-800 uppercase">
                <Leaf size={15} aria-hidden="true" /> {t('dashboard.collectionKicker')}
              </p>
              <h2 className="mt-2 font-display text-3xl font-medium text-ink">
                {t('dashboard.collectionTitle')} <em className="text-olive-600">{t('dashboard.collectionTitleEm')}</em>
              </h2>
            </div>
            <div className="flex gap-2">
              <Link
                to="/plants/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-forest-700 px-4 py-2 text-xs font-medium text-ivory hover:bg-forest-800"
              >
                <Plus size={14} aria-hidden="true" /> {t('dashboard.addPlantShort')}
              </Link>
              <Link
                to="/plants"
                className="rounded-full border border-beige-dark bg-white px-4 py-2 text-xs font-medium text-forest-800 hover:bg-ivory"
              >
                {t('dashboard.viewCollection')}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plants.slice(0, 6).map((plant) => {
              const task = waterTaskFor(plant.id)
              const attention = task?.status === 'OVERDUE' || task?.status === 'TODAY'
              return (
                <Link
                  key={plant.id}
                  to={`/plants/${plant.id}`}
                  className="group overflow-hidden rounded-3xl border border-beige bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-48 bg-sage-100">
                    {plant.photoUrl ? (
                      <img src={plant.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl" aria-hidden="true">
                        🌿
                      </div>
                    )}
                    <span
                      className={`absolute top-4 left-4 h-3 w-3 rounded-full ring-4 ring-white/70 ${
                        attention ? 'bg-amber-400' : 'bg-sage-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="absolute right-4 bottom-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-forest-800 shadow transition group-hover:translate-x-0.5">
                      <ArrowRight size={17} aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 p-5">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-medium text-ink">{plant.name}</h3>
                      <p className="truncate text-xs text-forest-700/70">{plant.location || plant.species}</p>
                    </div>
                    {task && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          attention ? 'bg-amber-100 text-amber-900' : 'bg-mint text-forest-800'
                        }`}
                      >
                        {task.status === 'UPCOMING' ? t('dashboard.thriving') : dueLabel(t, task)}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
