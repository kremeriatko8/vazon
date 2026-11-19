import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ActionToast } from '../components/ActionToast'
import { PageHeader } from '../components/PageHeader'
import { dueLabel, formatCareDate } from '../components/careActionMessages'
import { useCareTasks } from '../hooks/useCareTasks'
import { formatWaterAmount } from '../services/scheduleService'

type FilterTab = 'ALL' | 'DUE' | 'UPCOMING'

export function TasksPage() {
  const { t } = useTranslation()
  const care = useCareTasks()
  const [filter, setFilter] = useState<FilterTab>('ALL')

  const { tasks } = care
  const dueTasks = tasks.filter((task) => task.status !== 'UPCOMING')
  const visibleTasks =
    filter === 'DUE' ? dueTasks : filter === 'UPCOMING' ? tasks.filter((task) => task.status === 'UPCOMING') : tasks

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'ALL', label: t('tasks.all', { count: tasks.length }) },
    { id: 'DUE', label: t('tasks.dueNow', { count: dueTasks.length }) },
    { id: 'UPCOMING', label: t('tasks.upcoming', { count: tasks.length - dueTasks.length }) },
  ]

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <ActionToast toast={care.toast} onDismiss={care.dismissToast} />
      {care.dialog}
      <PageHeader kicker={t('tasks.schedule')} title={t('tasks.title')} titleEm={t('tasks.titleEm')}>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('tasks.filter')}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === tab.id
                  ? 'bg-olive-800 text-ivory'
                  : 'border border-beige-dark bg-white text-forest-800 hover:bg-ivory'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {care.error && (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {care.error}
        </div>
      )}

      {care.loading ? (
        <p className="mt-8 text-sm text-forest-700/75">{t('tasks.loading')}</p>
      ) : visibleTasks.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-beige bg-white p-8 text-center">
          <p className="font-display text-lg font-medium text-forest-800">{t('tasks.allCaughtUp')}</p>
          <p className="mt-1 text-sm text-forest-700/75">{t('tasks.noTasksCategory')}</p>
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
            const amount = task.action === 'WATERED' ? formatWaterAmount(task.waterAmountMl) : null

            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-beige bg-white p-5 shadow-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyle}`}>
                      {dueLabel(t, task)}
                    </span>
                    <span className="text-xs font-medium text-forest-700/80">
                      {t(task.action === 'WATERED' ? 'tasks.water' : 'tasks.feed')} ·{' '}
                      {formatCareDate(`${task.dueDate}T12:00:00Z`)}
                    </span>
                  </div>
                  <Link
                    to={`/plants/${task.plantId}`}
                    className="mt-1.5 inline-block font-display text-xl font-medium text-ink hover:underline"
                  >
                    {task.plantName}
                  </Link>
                  {amount && <p className="text-xs text-forest-700/80">{t('care.waterAmount', { amount })}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {task.action === 'WATERED' && task.status !== 'UPCOMING' && (
                    <button
                      type="button"
                      title={t('care.checkAgainHint')}
                      disabled={care.isDisabled(task)}
                      onClick={() => void care.soilStillWet(task)}
                      className="rounded-full border border-beige-dark bg-ivory/60 px-3.5 py-2 text-xs font-medium text-forest-800 transition hover:bg-beige/60 disabled:opacity-60"
                    >
                      {care.isBusy(task, 'snooze') ? t('care.saving') : t('tasks.soilStillWet')}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={care.isDisabled(task)}
                    onClick={() => void care.complete(task)}
                    className="rounded-full bg-olive-800 px-4 py-2 text-xs font-semibold text-ivory transition hover:bg-olive-900 disabled:opacity-60"
                  >
                    {care.isBusy(task, 'complete')
                      ? t('care.saving')
                      : t(task.action === 'WATERED' ? 'care.markWatered' : 'care.markFed')}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
