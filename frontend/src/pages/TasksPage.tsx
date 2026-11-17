import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllCareLogs, logCareAction } from '../services/careLogService'
import { getPlants } from '../services/plantService'
import { buildCareTasks, type CareTask } from '../services/scheduleService'

type FilterTab = 'ALL' | 'DUE' | 'UPCOMING'

export function TasksPage() {
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [filter, setFilter] = useState<FilterTab>('ALL')
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getPlants(), getAllCareLogs()])
      .then(([plants, logs]) => {
        if (!cancelled) setTasks(buildCareTasks(plants, logs))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load care schedule.')
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
      const [plants, logs] = await Promise.all([getPlants(), getAllCareLogs()])
      setTasks(buildCareTasks(plants, logs))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete task.')
    } finally {
      setCompletingId(null)
    }
  }

  const dueTasks = tasks.filter((t) => t.status === 'OVERDUE' || t.status === 'TODAY')
  const visibleTasks =
    filter === 'DUE' ? dueTasks : filter === 'UPCOMING' ? tasks.filter((t) => t.status === 'UPCOMING') : tasks

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">Schedule</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-forest-800">Care tasks</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              filter === 'ALL'
                ? 'bg-forest-700 text-ivory'
                : 'border border-beige-dark bg-white text-forest-800 hover:bg-ivory'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('DUE')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              filter === 'DUE'
                ? 'bg-forest-700 text-ivory'
                : 'border border-beige-dark bg-white text-forest-800 hover:bg-ivory'
            }`}
          >
            Due now ({dueTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('UPCOMING')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              filter === 'UPCOMING'
                ? 'bg-forest-700 text-ivory'
                : 'border border-beige-dark bg-white text-forest-800 hover:bg-ivory'
            }`}
          >
            Upcoming ({tasks.length - dueTasks.length})
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-forest-700/75">Calculating care schedule...</p>
      ) : visibleTasks.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-beige bg-white p-8 text-center">
          <p className="font-display text-lg font-medium text-forest-800">All caught up!</p>
          <p className="mt-1 text-sm text-forest-700/75">No care tasks in this category right now.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visibleTasks.map((task) => {
            const badgeStyle =
              task.status === 'OVERDUE'
                ? 'bg-red-100 text-red-800'
                : task.status === 'TODAY'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-sage-100 text-forest-800'

            const dueLabel =
              task.status === 'OVERDUE'
                ? `${Math.abs(task.daysUntilDue)} day${Math.abs(task.daysUntilDue) === 1 ? '' : 's'} overdue`
                : task.status === 'TODAY'
                  ? 'Due today'
                  : `In ${task.daysUntilDue} day${task.daysUntilDue === 1 ? '' : 's'}`

            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-beige bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyle}`}>
                      {dueLabel}
                    </span>
                    <span className="text-xs font-medium text-forest-700/80">
                      {task.action === 'WATERED' ? 'Water' : 'Fertilize'} · {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    to={`/plants/${task.plantId}`}
                    className="mt-1.5 inline-block font-display text-lg font-semibold text-forest-800 hover:underline"
                  >
                    {task.plantName}
                  </Link>
                  {task.location && <p className="text-xs text-forest-700/70">{task.location}</p>}
                </div>

                <button
                  type="button"
                  disabled={completingId === task.id}
                  onClick={() => void handleComplete(task)}
                  className="rounded-full bg-forest-700 px-4 py-2 text-xs font-medium text-ivory transition hover:bg-forest-800 disabled:opacity-60"
                >
                  {completingId === task.id ? 'Saving...' : 'Mark done'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
