import { ArrowLeft, CloudDrizzle, Droplets, MapPin, Pencil, Shovel, Sprout, Undo2, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ActionToast, type ToastMessage } from '../components/ActionToast'
import { careSuccessText, dueLabel, errorToast, formatCareDate, successToast } from '../components/careActionMessages'
import { PlantPhoto } from '../components/PlantPhoto'
import { ui } from '../components/styles'
import { AlreadyLoggedTodayError, useCareRecorder } from '../hooks/useCareRecorder'
import { ApiError } from '../services/apiClient'
import { canUndo, conflictCode, getPlantCareLogs, undoCareAction } from '../services/careLogService'
import { getPlantById, updatePlant } from '../services/plantService'
import { formatWaterAmount, getCareTasks, type CareTask } from '../services/scheduleService'
import type { CareActionType, CareLog, LightCondition, Plant, PotSize, RadiatorDistance } from '../types/plant'

const LIGHTS: LightCondition[] = ['LOW', 'MEDIUM', 'BRIGHT_INDIRECT', 'DIRECT']
const POTS: PotSize[] = ['SMALL', 'MEDIUM', 'LARGE']
const RADIATORS: RadiatorDistance[] = ['NONE', 'FAR', 'MEDIUM', 'NEAR']

const ACTION_ICONS: Record<CareActionType, LucideIcon> = {
  WATERED: Droplets,
  FED: Sprout,
  REPOTTED: Shovel,
  SOIL_WET: CloudDrizzle,
}

export function PlantDetailPage() {
  const { t, i18n } = useTranslation()
  const { record, dialog: careDialog } = useCareRecorder()
  const { id } = useParams<{ id: string }>()
  const photoFailed = (useLocation().state as { photoFailed?: boolean } | null)?.photoFailed === true
  const [plant, setPlant] = useState<Plant | null>(null)
  const [logs, setLogs] = useState<CareLog[]>([])
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingAction, setSavingAction] = useState<CareActionType | null>(null)
  const [undoingId, setUndoingId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [edit, setEdit] = useState({
    name: '',
    species: '',
    lightCondition: 'MEDIUM' as LightCondition,
    potSize: 'MEDIUM' as PotSize,
    radiatorDistance: 'NONE' as RadiatorDistance,
    location: '',
    notes: '',
  })

  const refreshTasks = useCallback(() => {
    if (!id) return
    getCareTasks()
      .then((list) => setTasks(list.filter((task) => task.plantId === id)))
      .catch(() => undefined)
  }, [id])

  useEffect(() => {
    if (!id) return
    let active = true
    // A failing care log request must not hide the plant: fall back to an empty log.
    const careLogsRequest = getPlantCareLogs(id).catch((err: unknown) => {
      console.warn('Care log request failed', { status: err instanceof ApiError ? err.status : 'unknown' })
      return [] as CareLog[]
    })
    Promise.all([getPlantById(id), careLogsRequest])
      .then(([foundPlant, careLogs]) => {
        if (!active) return
        setPlant(foundPlant)
        setLogs(careLogs)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : t('plant.loadFailed'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    getCareTasks()
      .then((list) => {
        if (active) setTasks(list.filter((task) => task.plantId === id))
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [id, t])

  function startEditing() {
    if (!plant) return
    setEdit({
      name: plant.name,
      species: plant.species,
      lightCondition: plant.lightCondition,
      potSize: plant.potSize,
      radiatorDistance: plant.radiatorDistance,
      location: plant.location ?? '',
      notes: plant.notes ?? '',
    })
    setError(null)
    setIsEditing(true)
  }

  async function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!plant || !edit.name.trim() || !edit.species.trim()) return
    setSavingEdit(true)
    setError(null)
    try {
      const updated = await updatePlant(plant.id, {
        name: edit.name.trim(),
        species: edit.species.trim(),
        lightCondition: edit.lightCondition,
        potSize: edit.potSize,
        radiatorDistance: edit.radiatorDistance,
        location: edit.location.trim() || null,
        notes: edit.notes.trim() || null,
      })
      setPlant(updated)
      setIsEditing(false)
      refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('plant.updateFailed'))
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleQuickAction(actionType: CareActionType) {
    if (!plant) return
    setError(null)
    setSavingAction(actionType)
    try {
      const created = await record(plant.id, actionType, note)
      if (!created) return
      setLogs((prev) => [created, ...prev])
      setNote('')
      const next = await getCareTasks().catch(() => [] as CareTask[])
      const mine = next.filter((task) => task.plantId === plant.id)
      setTasks(mine)
      const nextWatering = actionType === 'WATERED' ? mine.find((task) => task.action === 'WATERED')?.dueDate : undefined
      setToast(
        successToast(
          actionType === 'SOIL_WET'
            ? t('care.toast.soilWetLogged', { plant: plant.name })
            : careSuccessText(t, actionType, plant.name, nextWatering ? `${nextWatering}T12:00:00Z` : undefined),
        ),
      )
    } catch (err) {
      if (err instanceof AlreadyLoggedTodayError) {
        setToast(successToast(t('care.toast.alreadyChecked', { plant: plant.name })))
        return
      }
      setError(err instanceof Error ? err.message : t('care.toast.saveFailed'))
      setToast(errorToast(t))
    } finally {
      setSavingAction(null)
    }
  }

  async function handleUndo(entry: CareLog) {
    if (!plant) return
    setUndoingId(entry.id)
    setError(null)
    try {
      await undoCareAction(plant.id, entry.id)
      setLogs((prev) => prev.filter((log) => log.id !== entry.id))
      refreshTasks()
      setToast(successToast(t('plant.undone')))
    } catch (err) {
      setError(conflictCode(err) === 'UNDO_EXPIRED' ? t('plant.undoExpired') : t('plant.undoFailed'))
    } finally {
      setUndoingId(null)
    }
  }

  const locale = i18n.language === 'uk' ? 'uk-UA' : 'en-GB'

  if (loading) {
    return (
      <main className="product-page product-shell">
        <p className={ui.muted}>{t('plant.loading')}</p>
      </main>
    )
  }

  if (!plant) {
    return (
      <main className="product-page product-shell">
        <Link to="/plants" className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:text-forest-900">
          <ArrowLeft size={16} aria-hidden="true" /> {t('addPlant.back')}
        </Link>
        <div className={`mt-6 p-10 text-center ${ui.card}`}>
          <h1 className="app-subtitle">{t('plant.notFound')}</h1>
          <p className={`mt-2 ${ui.muted}`}>{t('plant.notFoundHint')}</p>
        </div>
      </main>
    )
  }

  const water = tasks.find((task) => task.action === 'WATERED')
  const feed = tasks.find((task) => task.action === 'FED')
  const waterAmount = water ? formatWaterAmount(water.waterAmountMl) : null
  const actions: { type: CareActionType; label: string; primary?: boolean }[] = [
    { type: 'WATERED', label: t('plant.actionWater'), primary: true },
    { type: 'FED', label: t('plant.actionFeed') },
    { type: 'REPOTTED', label: t('plant.actionRepot') },
    { type: 'SOIL_WET', label: t('plant.actionSoilWet') },
  ]

  return (
    <main className="product-page product-shell">
      <ActionToast toast={toast} onDismiss={() => setToast(null)} />
      {careDialog}
      <Link to="/plants" className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:text-forest-900">
        <ArrowLeft size={16} aria-hidden="true" /> {t('addPlant.back')}
      </Link>

      {error && (
        <div role="alert" className={`mt-4 ${ui.error}`}>
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <PlantPhoto plant={plant} onChange={setPlant} initialError={photoFailed ? t('photo.uploadFailedAfterCreate') : null} />

        {isEditing ? (
          <form onSubmit={(e) => void handleEditSubmit(e)} className={`space-y-4 p-6 sm:p-8 ${ui.card}`}>
            <div className="flex items-center justify-between gap-4">
              <h1 className="app-subtitle">{t('plant.editTitle')}</h1>
              <button type="button" onClick={() => setIsEditing(false)} className="text-xs font-medium text-forest-700 hover:text-forest-900">
                {t('care.tooEarly.cancel')}
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-name" className={ui.label}>
                  {t('addPlant.nameLabel')}
                </label>
                <input
                  id="edit-name"
                  required
                  maxLength={100}
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  className={ui.input}
                />
              </div>
              <div>
                <label htmlFor="edit-species" className={ui.label}>
                  {t('plant.speciesLabel')}
                </label>
                <input
                  id="edit-species"
                  required
                  maxLength={120}
                  value={edit.species}
                  onChange={(e) => setEdit({ ...edit, species: e.target.value })}
                  className={ui.input}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="edit-light" className={ui.label}>
                  {t('addPlant.lightLabel')}
                </label>
                <select
                  id="edit-light"
                  value={edit.lightCondition}
                  onChange={(e) => setEdit({ ...edit, lightCondition: e.target.value as LightCondition })}
                  className={ui.input}
                >
                  {LIGHTS.map((v) => (
                    <option key={v} value={v}>
                      {t(`light.${v}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-pot" className={ui.label}>
                  {t('addPlant.potLabel')}
                </label>
                <select
                  id="edit-pot"
                  value={edit.potSize}
                  onChange={(e) => setEdit({ ...edit, potSize: e.target.value as PotSize })}
                  className={ui.input}
                >
                  {POTS.map((v) => (
                    <option key={v} value={v}>
                      {t(`pot.${v}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-radiator" className={ui.label}>
                  {t('addPlant.radiatorLabel')}
                </label>
                <select
                  id="edit-radiator"
                  value={edit.radiatorDistance}
                  onChange={(e) => setEdit({ ...edit, radiatorDistance: e.target.value as RadiatorDistance })}
                  className={ui.input}
                >
                  {RADIATORS.map((v) => (
                    <option key={v} value={v}>
                      {t(`radiator.${v}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="edit-location" className={ui.label}>
                {t('addPlant.locationLabel')}
              </label>
              <input
                id="edit-location"
                maxLength={100}
                value={edit.location}
                onChange={(e) => setEdit({ ...edit, location: e.target.value })}
                className={ui.input}
              />
            </div>
            <div>
              <label htmlFor="edit-notes" className={ui.label}>
                {t('addPlant.notesLabel')}
              </label>
              <textarea
                id="edit-notes"
                rows={3}
                maxLength={1000}
                value={edit.notes}
                onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
                className={ui.input}
              />
            </div>
            <button type="submit" disabled={savingEdit} className={`w-full ${ui.btnPrimary}`}>
              {savingEdit ? t('addPlant.saving') : t('plant.saveChanges')}
            </button>
          </form>
        ) : (
          <div className={`p-6 sm:p-8 ${ui.card}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="app-kicker">{t('plant.kicker')}</div>
                <h1 className="app-title mt-3">{plant.name}</h1>
                <p className="mt-1 text-sm text-forest-700/75 italic">{plant.species}</p>
                {plant.location && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-forest-700/85">
                    <MapPin size={15} aria-hidden="true" /> {plant.location}
                  </p>
                )}
              </div>
              <button type="button" onClick={startEditing} className={ui.btnSecondary}>
                <Pencil size={14} aria-hidden="true" /> {t('plant.edit')}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              <span className={ui.chip}>{t(`light.${plant.lightCondition}`)}</span>
              <span className={ui.chip}>{t(`pot.${plant.potSize}`)}</span>
              <span className={ui.chip}>{t(`radiator.${plant.radiatorDistance}`)}</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl p-4 text-white" style={{ background: 'radial-gradient(circle at 80% 20%, #71822d 0, #50651a 30%, #354a08 70%)' }}>
                <p className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-white/70 uppercase">
                  <Droplets size={14} aria-hidden="true" /> {t('plant.nextWatering')}
                </p>
                <p className="mt-1 font-display text-xl">
                  {water ? formatCareDate(`${water.dueDate}T12:00:00Z`) : '—'}
                </p>
                <p className="text-xs text-white/75">
                  {[water && dueLabel(t, water), waterAmount && t('care.amountShort', { amount: waterAmount })]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--mint)] p-4 text-[var(--forest)]">
                <p className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-forest-700/70 uppercase">
                  <Sprout size={14} aria-hidden="true" /> {t('plant.nextFeeding')}
                </p>
                <p className="mt-1 font-display text-xl">{feed ? formatCareDate(`${feed.dueDate}T12:00:00Z`) : '—'}</p>
                <p className="text-xs text-forest-700/75">{feed ? dueLabel(t, feed) : t('plant.noFeeding')}</p>
              </div>
            </div>

            {plant.notes && (
              <p className="mt-5 rounded-2xl border border-beige bg-ivory/50 px-4 py-3 text-sm text-forest-800">{plant.notes}</p>
            )}
          </div>
        )}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className={`mt-6 p-6 sm:p-8 ${ui.card}`}>
        <h2 className="app-subtitle">{t('plant.careTitle')}</h2>
        <label htmlFor="care-note" className="mt-4 block text-xs font-medium text-forest-700/80">
          {t('plant.noteLabel')}
        </label>
        <input
          id="care-note"
          type="text"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('plant.notePlaceholder')}
          className={ui.input}
        />
        <div className="mt-4 grid gap-2.5 sm:grid-cols-4">
          {actions.map(({ type, label, primary }) => {
            const Icon = ACTION_ICONS[type]
            return (
              <button
                key={type}
                type="button"
                disabled={savingAction !== null}
                onClick={() => void handleQuickAction(type)}
                className={primary ? ui.btnPrimary : ui.btnSecondary}
              >
                <Icon size={16} aria-hidden="true" /> {savingAction === type ? t('care.saving') : label}
              </button>
            )
          })}
        </div>
      </form>

      <div className={`mt-6 p-6 sm:p-8 ${ui.card}`}>
        <h2 className="app-subtitle">
          {t('plant.journalTitle')} <em>{t('plant.journalTitleEm')}</em>
        </h2>
        {logs.length === 0 ? (
          <p className={`mt-3 ${ui.muted}`}>{t('plant.journalEmpty')}</p>
        ) : (
          <ol className="mt-5 space-y-3">
            {logs.map((entry) => {
              const Icon = ACTION_ICONS[entry.actionType]
              return (
                <li key={entry.id} className="flex items-start gap-3">
                  <span className="task-type-icon mt-0.5 shrink-0">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-sm font-semibold text-[var(--forest)]">{t(`plant.log.${entry.actionType}`)}</p>
                      <time dateTime={entry.actionDate} className="text-xs text-forest-700/70">
                        {new Date(entry.actionDate).toLocaleString(locale, {
                          timeZone: 'Europe/Kyiv',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    {entry.notes && <p className="mt-0.5 text-sm text-forest-800/90">{entry.notes}</p>}
                  </div>
                  {canUndo(entry) && (
                    <button
                      type="button"
                      disabled={undoingId !== null}
                      onClick={() => void handleUndo(entry)}
                      className={ui.btnDanger}
                      title={t('plant.undoHint')}
                    >
                      <Undo2 size={14} aria-hidden="true" /> {undoingId === entry.id ? t('care.saving') : t('plant.undo')}
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </main>
  )
}
