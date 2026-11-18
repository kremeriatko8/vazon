import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../services/apiClient'
import { getPlantCareLogs, logCareAction } from '../services/careLogService'
import { getPlantById, updatePlant } from '../services/plantService'
import type {
  CareActionType,
  CareLog,
  LightCondition,
  Plant,
  PotSize,
  RadiatorDistance,
} from '../types/plant'

const LIGHT_LABELS: Record<LightCondition, string> = {
  LOW: 'Low light',
  MEDIUM: 'Medium light',
  BRIGHT_INDIRECT: 'Bright indirect',
  DIRECT: 'Direct sun',
}

const POT_LABELS: Record<PotSize, string> = {
  SMALL: 'Small pot',
  MEDIUM: 'Medium pot',
  LARGE: 'Large pot',
}

const RADIATOR_LABELS: Record<RadiatorDistance, string> = {
  NEAR: 'Near radiator (< 1m)',
  MEDIUM: 'Medium (1–2m)',
  FAR: 'Far (> 2m)',
  NONE: 'No radiator',
}

const ACTION_LABELS: Record<CareActionType, string> = {
  WATERED: 'Watered',
  FED: 'Fed',
  REPOTTED: 'Repotted',
  SOIL_WET: 'Soil still wet',
}

export function PlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [plant, setPlant] = useState<Plant | null>(null)
  const [logs, setLogs] = useState<CareLog[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingAction, setSavingAction] = useState<CareActionType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSpecies, setEditSpecies] = useState('')
  const [editLightCondition, setEditLightCondition] = useState<LightCondition>('BRIGHT_INDIRECT')
  const [editPotSize, setEditPotSize] = useState<PotSize>('MEDIUM')
  const [editRadiatorDistance, setEditRadiatorDistance] = useState<RadiatorDistance>('NONE')

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
        if (active) setError(err instanceof Error ? err.message : 'Failed to load plant details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  function startEditing() {
    if (!plant) return
    setEditName(plant.name)
    setEditSpecies(plant.species)
    setEditLightCondition(plant.lightCondition)
    setEditPotSize(plant.potSize)
    setEditRadiatorDistance(plant.radiatorDistance)
    setError(null)
    setIsEditing(true)
  }

  async function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!plant || !editName.trim() || !editSpecies.trim()) return
    setSavingEdit(true)
    setError(null)
    try {
      const updated = await updatePlant(plant.id, {
        name: editName.trim(),
        species: editSpecies.trim(),
        lightCondition: editLightCondition,
        potSize: editPotSize,
        radiatorDistance: editRadiatorDistance,
      })
      setPlant(updated)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update plant.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleQuickAction(actionType: CareActionType) {
    if (!plant) return
    setError(null)
    setSavingAction(actionType)
    try {
      const created = await logCareAction(plant.id, actionType, note)
      setLogs((prev) => [created, ...prev])
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record care action.')
    } finally {
      setSavingAction(null)
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-forest-700/75">Loading plant details...</p>
      </section>
    )
  }

  if (!plant) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/plants" className="inline-flex items-center text-sm font-medium text-forest-700 hover:text-forest-900">
          ← Back to my plants
        </Link>
        <div className="leaf-empty mt-6 rounded-3xl border border-beige bg-paper p-8 text-center shadow-botanical">
          <h1 className="page-title font-display text-2xl font-extrabold tracking-tight text-forest-800">Plant not found</h1>
          <p className="mt-2 text-sm text-forest-700/75">
            This plant may have been removed or the link is invalid.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/plants" className="inline-flex items-center text-sm font-medium text-forest-700 hover:text-forest-900">
        ← Back to my plants
      </Link>

      {error && (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-4 rounded-3xl border border-beige bg-paper p-6 card-reveal shadow-botanical sm:p-8">
        {isEditing ? (
          <form onSubmit={(e) => void handleEditSubmit(e)} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h1 className="page-title font-display text-2xl font-extrabold tracking-tight text-forest-800">Edit plant</h1>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs font-medium text-forest-700 hover:text-forest-900"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-name" className="block text-xs font-medium text-forest-800">
                  Plant name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="edit-species" className="block text-xs font-medium text-forest-800">
                  Species
                </label>
                <input
                  id="edit-species"
                  type="text"
                  required
                  value={editSpecies}
                  onChange={(e) => setEditSpecies(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="edit-light" className="block text-xs font-medium text-forest-800">
                  Light condition
                </label>
                <select
                  id="edit-light"
                  value={editLightCondition}
                  onChange={(e) => setEditLightCondition(e.target.value as LightCondition)}
                  className="mt-1 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
                >
                  <option value="LOW">Low light</option>
                  <option value="MEDIUM">Medium light</option>
                  <option value="BRIGHT_INDIRECT">Bright indirect</option>
                  <option value="DIRECT">Direct sun</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-pot" className="block text-xs font-medium text-forest-800">
                  Pot size
                </label>
                <select
                  id="edit-pot"
                  value={editPotSize}
                  onChange={(e) => setEditPotSize(e.target.value as PotSize)}
                  className="mt-1 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
                >
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-radiator" className="block text-xs font-medium text-forest-800">
                  Radiator distance
                </label>
                <select
                  id="edit-radiator"
                  value={editRadiatorDistance}
                  onChange={(e) => setEditRadiatorDistance(e.target.value as RadiatorDistance)}
                  className="mt-1 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
                >
                  <option value="NONE">No radiator</option>
                  <option value="NEAR">Near (&lt; 1m)</option>
                  <option value="MEDIUM">Medium (1–2m)</option>
                  <option value="FAR">Far (&gt; 2m)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full border border-beige-dark bg-white px-4 py-2 text-xs font-medium text-forest-800 motion-safe:transition-colors hover:bg-ivory"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-full bg-forest-700 px-5 py-2 text-xs font-medium text-ivory motion-safe:transition-colors hover:bg-forest-800 disabled:opacity-60"
              >
                {savingEdit ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">Plant profile</p>
                <h1 className="page-title mt-1 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-forest-800">{plant.name}</h1>
                <p className="mt-0.5 text-sm italic text-forest-700/75">{plant.species}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-sage-100 px-3.5 py-1.5 text-xs font-medium text-forest-800">
                  {LIGHT_LABELS[plant.lightCondition]}
                </span>
                <button
                  type="button"
                  onClick={startEditing}
                  className="rounded-full border border-beige-dark bg-white px-3.5 py-1.5 text-xs font-medium text-forest-800 motion-safe:transition-colors hover:bg-ivory"
                >
                  Edit plant
                </button>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 rounded-2xl bg-ivory/60 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-forest-700/70">Pot size</dt>
                <dd className="mt-0.5 font-medium text-forest-900">{POT_LABELS[plant.potSize]}</dd>
              </div>
              <div>
                <dt className="text-xs text-forest-700/70">Radiator distance</dt>
                <dd className="mt-0.5 font-medium text-forest-900">{RADIATOR_LABELS[plant.radiatorDistance]}</dd>
              </div>
              <div>
                <dt className="text-xs text-forest-700/70">Location</dt>
                <dd className="mt-0.5 font-medium text-forest-900">{plant.location || 'Not set'}</dd>
              </div>
            </dl>

            {plant.notes && (
              <p className="mt-4 rounded-2xl border border-beige/80 bg-ivory/30 px-4 py-3 text-sm text-forest-800">
                {plant.notes}
              </p>
            )}
          </>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="mt-6 border-t border-beige/70 pt-6">
          <label htmlFor="care-note" className="block text-xs font-medium tracking-wide text-forest-700 uppercase">
            Quick care log
          </label>
          <input
            id="care-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (e.g. Added liquid fertilizer, checked soil)..."
            className="mt-2 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={savingAction !== null}
              onClick={() => void handleQuickAction('WATERED')}
              className="rounded-full bg-forest-700 px-4 py-2 text-xs font-medium text-ivory motion-safe:transition-colors hover:bg-forest-800 disabled:opacity-60"
            >
              {savingAction === 'WATERED' ? 'Saving...' : 'Water now'}
            </button>
            <button
              type="button"
              disabled={savingAction !== null}
              onClick={() => void handleQuickAction('FED')}
              className="rounded-full border border-forest-700 bg-white px-4 py-2 text-xs font-medium text-forest-800 motion-safe:transition-colors hover:bg-sage-100/60 disabled:opacity-60"
            >
              {savingAction === 'FED' ? 'Saving...' : 'Feed'}
            </button>
            <button
              type="button"
              disabled={savingAction !== null}
              onClick={() => void handleQuickAction('REPOTTED')}
              className="rounded-full border border-beige-dark bg-ivory/50 px-4 py-2 text-xs font-medium text-forest-800 motion-safe:transition-colors hover:bg-beige/50 disabled:opacity-60"
            >
              {savingAction === 'REPOTTED' ? 'Saving...' : 'Repot'}
            </button>
            <button
              type="button"
              disabled={savingAction !== null}
              onClick={() => void handleQuickAction('SOIL_WET')}
              className="rounded-full border border-clay-800/20 bg-clay-100 px-4 py-2 text-xs font-medium text-clay-800 motion-safe:transition-colors hover:bg-clay-100/70 disabled:opacity-60"
            >
              {savingAction === 'SOIL_WET' ? 'Saving...' : 'Soil still wet'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 rounded-3xl border border-beige bg-paper p-6 card-reveal shadow-botanical sm:p-8">
        <h2 className="font-display text-xl font-bold text-forest-800">Care history</h2>
        {logs.length === 0 ? (
          <p className="leaf-empty mt-6 text-center text-sm text-forest-700/75">
            No care actions recorded yet. Use the buttons above to log your first watering.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-beige/70">
            {logs.map((entry) => (
              <li key={entry.id} className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <div>
                  <span className="inline-block rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-forest-800">
                    {ACTION_LABELS[entry.actionType]}
                  </span>
                  {entry.notes && <p className="mt-1 text-sm text-forest-800/90">{entry.notes}</p>}
                </div>
                <time dateTime={entry.actionDate} className="text-xs text-forest-700/70">
                  {new Date(entry.actionDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
