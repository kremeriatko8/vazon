import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getAllCareLogs, logCareAction } from '../services/careLogService'
import { getPlants } from '../services/plantService'
import { buildCareTasks, type CareTask } from '../services/scheduleService'
import type { Plant } from '../types/plant'

export function DashboardPage() {
  const { user } = useAuth()
  const [plants, setPlants] = useState<Plant[]>([])
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getPlants(), getAllCareLogs()])
      .then(([plantList, logs]) => {
        if (!cancelled) {
          setPlants(plantList)
          setTasks(buildCareTasks(plantList, logs))
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
    setError(null)
    try {
      await logCareAction(task.plantId, task.action)
      const [plantList, logs] = await Promise.all([getPlants(), getAllCareLogs()])
      setPlants(plantList)
      setTasks(buildCareTasks(plantList, logs))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record care action.')
    } finally {
      setCompletingId(null)
    }
  }

  const overdueCount = tasks.filter((t) => t.status === 'OVERDUE').length
  const dueTodayCount = tasks.filter((t) => t.status === 'TODAY').length
  const urgentTasks = tasks.filter((t) => t.status !== 'UPCOMING').slice(0, 4)

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">Overview</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-forest-800">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
        </div>
        <div className="flex gap-2.5">
          <Link to="/plants/new" className="rounded-full bg-forest-700 px-4 py-2.5 text-xs font-medium text-ivory transition hover:bg-forest-800">
            + Add plant
          </Link>
          <Link to="/tasks" className="rounded-full border border-beige-dark bg-white px-4 py-2.5 text-xs font-medium text-forest-800 transition hover:bg-ivory">
            Full schedule
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
              <p className="text-xs font-medium text-forest-700/70">Total plants</p>
              <p className="mt-2 font-display text-3xl font-semibold text-forest-800">{plants.length}</p>
              <Link to="/plants" className="mt-3 inline-block text-xs font-medium text-forest-700 hover:underline">
                View collection →
              </Link>
            </div>

            <div className="rounded-3xl border border-beige bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-forest-700/70">Due today</p>
              <p className="mt-2 font-display text-3xl font-semibold text-amber-800">{dueTodayCount}</p>
              <p className="mt-3 text-xs text-forest-700/70">Scheduled for today</p>
            </div>

            <div className="rounded-3xl border border-beige bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-forest-700/70">Overdue</p>
              <p className="mt-2 font-display text-3xl font-semibold text-red-700">{overdueCount}</p>
              <p className="mt-3 text-xs text-forest-700/70">Needs prompt care</p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-beige bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-forest-800">Needs attention now</h2>
              <Link to="/tasks" className="text-xs font-medium text-forest-700 hover:underline">
                See all ({tasks.length}) →
              </Link>
            </div>

            {urgentTasks.length === 0 ? (
              <p className="mt-4 text-sm text-forest-700/75">
                Every plant is watered and happy. Check the full schedule to see upcoming tasks.
              </p>
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
                            : 'Due today'}
                        </span>
                        <span className="text-xs text-forest-700/80">
                          {task.action === 'WATERED' ? 'Water' : 'Fertilize'}
                        </span>
                      </div>
                      <Link
                        to={`/plants/${task.plantId}`}
                        className="mt-1 inline-block font-display text-base font-semibold text-forest-800 hover:underline"
                      >
                        {task.plantName}
                      </Link>
                    </div>

                    <button
                      type="button"
                      disabled={completingId === task.id}
                      onClick={() => void handleComplete(task)}
                      className="rounded-full bg-forest-700 px-3.5 py-1.5 text-xs font-medium text-ivory transition hover:bg-forest-800 disabled:opacity-60"
                    >
                      {completingId === task.id ? 'Saving...' : 'Mark done'}
                    </button>
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
