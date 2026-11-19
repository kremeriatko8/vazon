import { Droplets, Sprout } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ActionToast } from '../components/ActionToast'
import { dueLabel, formatCareDate } from '../components/careActionMessages'
import { PageHeading } from '../components/PageHeading'
import { useCareTasks } from '../hooks/useCareTasks'
import { formatWaterAmount } from '../services/scheduleService'

type FilterTab = 'ALL' | 'DUE' | 'UPCOMING'

/** Care tasks, from TasksPage in the "Extend Design Across Pages" design. */
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
    <main className="product-page narrow product-shell">
      <ActionToast toast={care.toast} onDismiss={care.dismissToast} />
      {care.dialog}
      <div className="task-heading-row">
        <PageHeading kicker={t('tasks.schedule')} title={t('tasks.title')} accent={t('tasks.titleEm')} />
        <div className="task-tabs" role="group" aria-label={t('tasks.filter')}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={filter === tab.id ? 'active' : ''}
              aria-pressed={filter === tab.id}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {care.error && (
        <p role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {care.error}
        </p>
      )}

      {care.loading ? (
        <p className="text-sm text-[#778178]">{t('tasks.loading')}</p>
      ) : visibleTasks.length === 0 ? (
        <div className="empty-state">
          <Sprout />
          <h2>{t('tasks.allCaughtUp')}</h2>
          <p>{t('tasks.noTasksCategory')}</p>
        </div>
      ) : (
        <div className="task-list">
          {visibleTasks.map((task) => {
            const isWater = task.action === 'WATERED'
            const amount = isWater ? formatWaterAmount(task.waterAmountMl) : null
            return (
              <article key={task.id}>
                <div className="task-day">
                  <span>{dueLabel(t, task)}</span>
                  <small>
                    {t(isWater ? 'tasks.water' : 'tasks.feed')} · {formatCareDate(`${task.dueDate}T12:00:00Z`)}
                  </small>
                </div>
                <div className="task-main">
                  <span className="task-type-icon">{isWater ? <Droplets /> : <Sprout />}</span>
                  <div>
                    <h2>
                      <Link to={`/plants/${task.plantId}`}>{task.plantName}</Link>
                    </h2>
                    <p>
                      {amount ? t('care.waterAmount', { amount }) : task.species}
                      {isWater && task.status !== 'UPCOMING' && (
                        <>
                          {' · '}
                          <button
                            type="button"
                            title={t('care.checkAgainHint')}
                            disabled={care.isDisabled(task)}
                            onClick={() => void care.soilStillWet(task)}
                            className="underline underline-offset-2"
                          >
                            {care.isBusy(task, 'snooze') ? t('care.saving') : t('tasks.soilStillWet')}
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="task-action"
                  disabled={care.isDisabled(task)}
                  onClick={() => void care.complete(task)}
                >
                  {care.isBusy(task, 'complete') ? t('care.saving') : t(isWater ? 'care.markWatered' : 'care.markFed')}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
