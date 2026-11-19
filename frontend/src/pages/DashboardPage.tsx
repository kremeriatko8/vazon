import { ArrowRight, Check, Plus } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ActionToast } from '../components/ActionToast'
import { AddPlantModal } from '../components/AddPlantModal'
import { dueLabel } from '../components/careActionMessages'
import { PageHeading } from '../components/PageHeading'
import { PlantImage } from '../components/PlantImage'
import { useAuth } from '../hooks/useAuth'
import { useCareTasks } from '../hooks/useCareTasks'
import { getAllCareLogs } from '../services/careLogService'
import { getPlants } from '../services/plantService'
import { kyivToday, type CareTask } from '../services/scheduleService'
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

/** Waterings and feedings logged today (Europe/Kyiv). */
function doneTodayCount(logs: CareLog[]): number {
  const today = kyivToday()
  return logs.filter(
    (log) => (log.actionType === 'WATERED' || log.actionType === 'FED') && kyivToday(new Date(log.actionDate)) === today,
  ).length
}

/** Today, from TodayPage in the "Extend Design Across Pages" design, with real tasks and plants. */
export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const care = useCareTasks()
  const [plants, setPlants] = useState<Plant[]>([])
  const [logs, setLogs] = useState<CareLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

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
        if (!cancelled) setError(err instanceof Error ? err.message : t('dashboard.loadFailed'))
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

  const due = care.tasks.filter((task) => task.status !== 'UPCOMING')
  const later = care.tasks.filter((task) => task.status === 'UPCOMING').slice(0, due.length > 0 ? 2 : 4)
  const done = doneTodayCount(logs)
  const total = done + due.length
  const percent = total === 0 ? 100 : (done / total) * 100
  const name = user?.email ? user.email.split('@')[0] : ''
  const locale = i18n.language === 'uk' ? 'uk-UA' : 'en-GB'
  const now = new Date()
  const datePart = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: 'Europe/Kyiv', ...options }).format(now).replace('.', '')
  const featured = plants.find((plant) => plant.photoUrl) ?? plants[0]
  const waterTaskFor = (plantId: string) => care.tasks.find((task) => task.plantId === plantId && task.action === 'WATERED')

  return (
    <main>
      <ActionToast toast={care.toast} onDismiss={care.dismissToast} />
      {care.dialog}
      <section className="today-hero">
        <div className="product-shell">
          <div className="today-title">
            <div>
              <div className="app-kicker light">
                <span /> {t('dashboard.kicker')}
              </div>
              <h1>
                {t(greetingKey())}
                {name && (
                  <>
                    , <em>{name}.</em>
                  </>
                )}
              </h1>
            </div>
            <div className="today-date">
              <small>{datePart({ weekday: 'short' })}</small>
              <strong>{datePart({ day: '2-digit' })}</strong>
              <span>{datePart({ month: 'long' })}</span>
            </div>
          </div>

          {(error ?? care.error) && (
            <p role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {error ?? care.error}
            </p>
          )}

          <div className="today-grid">
            <article className="rhythm-card">
              <div className="rhythm-top">
                <div>
                  <small>{t('dashboard.rhythm')}</small>
                  <h2>
                    {care.loading
                      ? t('dashboard.loading')
                      : due.length === 0
                        ? t('dashboard.allDone')
                        : t('dashboard.moments', { count: due.length })}
                  </h2>
                </div>
                <div
                  className="app-progress"
                  style={{ '--value': `${percent}%` } as CSSProperties}
                  role="img"
                  aria-label={t('dashboard.progressLabel', { done, total })}
                >
                  <span>
                    {done}/{total}
                  </span>
                </div>
              </div>
              {due.length > 0 && (
                <div className="up-next">
                  <span>{t('dashboard.dueNow')}</span>
                  {due.slice(0, 4).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      disabled={care.isDisabled(task)}
                      onClick={() => void complete(task)}
                      aria-label={`${t(task.action === 'WATERED' ? 'care.markWatered' : 'care.markFed')}: ${task.plantName}`}
                      title={t(task.action === 'WATERED' ? 'care.markWatered' : 'care.markFed')}
                    >
                      <span>
                        {t(task.action === 'WATERED' ? 'dashboard.waterPlant' : 'dashboard.feedPlant', { plant: task.plantName })}
                      </span>
                      <small>{care.isBusy(task, 'complete') ? t('care.saving') : dueLabel(t, task)}</small>
                      <i>{care.isBusy(task, 'complete') && <Check size={14} />}</i>
                    </button>
                  ))}
                </div>
              )}
              {/* Later tasks are information only: no check circle, they open the plant. */}
              <div className="up-next up-next--later">
                <span>{t('dashboard.upNext')}</span>
                {!care.loading && care.tasks.length === 0 && <small>{t('dashboard.noTasks')}</small>}
                {later.map((task) => (
                  <Link key={task.id} to={`/plants/${task.plantId}`}>
                    <span>
                      {t(task.action === 'WATERED' ? 'dashboard.waterPlant' : 'dashboard.feedPlant', { plant: task.plantName })}
                    </span>
                    <small>{dueLabel(t, task)}</small>
                  </Link>
                ))}
              </div>
              <Link className="wide-olive" to="/tasks">
                {t('dashboard.fullSchedule')} <ArrowRight size={17} />
              </Link>
            </article>

            {featured ? (
              <Link to={`/plants/${featured.id}`} className="featured-plant">
                <PlantImage plant={featured} iconSize={72} />
                <div className="featured-shade" />
                <span>{t('dashboard.spotlight')}</span>
                <div>
                  <h2>{t('dashboard.meet', { plant: featured.name })}</h2>
                  <p>{featured.species}</p>
                </div>
              </Link>
            ) : (
              <article className="featured-plant">
                <div className="featured-shade" />
                <span>{t('dashboard.spotlight')}</span>
                <div>
                  <h2>{t('dashboard.emptyTitle')}</h2>
                  <button type="button" className="app-button mt-3" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> {t('dashboard.addFirst')}
                  </button>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>

      <section className="today-collection product-shell">
        <div className="collection-intro">
          <PageHeading
            kicker={t('dashboard.collectionKicker')}
            title={t('dashboard.collectionTitle')}
            accent={t('dashboard.collectionTitleEm')}
          />
          <button type="button" className="app-button" onClick={() => setShowModal(true)}>
            <Plus size={16} /> {t('home.addPlant')}
          </button>
        </div>
        <div className="mini-plants">
          {plants.slice(0, 3).map((plant) => {
            const task = waterTaskFor(plant.id)
            return (
              <Link key={plant.id} to={`/plants/${plant.id}`} className="contents">
                <article>
                  <PlantImage plant={plant} iconSize={26} />
                  <div>
                    <h3>{plant.name}</h3>
                    <p>{plant.location || plant.species}</p>
                  </div>
                  <span>{task ? dueLabel(t, task) : t('dashboard.thriving')}</span>
                </article>
              </Link>
            )
          })}
        </div>
      </section>
      {showModal && (
        <AddPlantModal
          onClose={() => setShowModal(false)}
          rooms={[...new Set(plants.map((p) => p.location).filter((r): r is string => Boolean(r)))]}
          onCreated={(plant) => navigate(`/plants/${plant.id}`)}
        />
      )}
    </main>
  )
}
