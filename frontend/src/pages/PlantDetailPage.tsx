import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPlantCareLogs, logCareAction } from '../services/careLogService'
import { getPlantById } from '../services/plantService'
import type { CareActionType, CareLog, LightLevel, Plant } from '../types/plant'

const LIGHT_LABELS: Record<LightLevel, string> = {
  LOW: 'Low light',
  MEDIUM: 'Medium light',
  BRIGHT_INDIRECT: 'Bright indirect',
  DIRECT: 'Direct sun',
}

const ACTION_LABELS: Record<CareActionType, string> = {
  WATERED: 'Watered',
  FERTILIZED: 'Fertilized',
  MISTED: 'Misted leaves',
  REPOTTED: 'Repotted',
}

export function PlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [plant, setPlant] = useState<Plant | null>(null)
  const [logs, setLogs] = useState<CareLog[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingAction, setSavingAction] = useState<CareActionType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    Promise.all([getPlantById(id), getPlantCareLogs(id)])
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

  async function handleQuickAction(action: CareActionType) {
    if (!plant) return
    setError(null)
    setSavingAction(action)
    try {
      const created = await logCareAction(plant.id, action, note)
      setLogs((prev) => [created, ...prev])
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record care action.')
    } finally {
      setSavingAction(null)
    }
  }

  function handleNoteSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void handleQuickAction('WATERED')
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
        <Link to="/plants" className="text-sm font-medium text-forest-700 hover:text-forest-900">
          ← Back to my plants
        </Link>
        <div className="mt-6 rounded-3xl border border-beige bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-forest-800">Plant not found</h1>
          <p className="mt-2 text-sm text-forest-700/75">
            This plant may have been removed or the link is invalid.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/plants" className="text-sm font-medium text-forest-700 hover:text-forest-900">
        ← Back to my plants
      </Link>

      {error && (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-4 rounded-3xl border border-beige bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">Plant profile</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-forest-800">{plant.name}</h1>
            {plant.species && <p className="mt-0.5 text-sm italic text-forest-700/75">{plant.species}</p>}
          </div>
          <span className="rounded-full bg-sage-100 px-3.5 py-1.5 text-xs font-medium text-forest-800">
            {LIGHT_LABELS[plant.lightLevel]}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 rounded-2xl bg-ivory/60 p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-forest-700/70">Location</dt>
            <dd className="mt-0.5 font-medium text-forest-900">{plant.location || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-xs text-forest-700/70">Watering schedule</dt>
            <dd className="mt-0.5 font-medium text-forest-900">Every {plant.wateringIntervalDays} days</dd>
          </div>
          <div>
            <dt className="text-xs text-forest-700/70">Fertilizing schedule</dt>
            <dd className="mt-0.5 font-medium text-forest-900">
              {plant.fertilizingIntervalDays ? `Every ${plant.fertilizingIntervalDays} days` : 'As needed'}
            </dd>
          </div>
        </dl>

        {plant.notes && (
          <p className="mt-4 rounded-2xl border border-beige/80 bg-ivory/30 px-4 py-3 text-sm text-forest-800">
            {plant.notes}
          </p>
        )}

        <form onSubmit={handleNoteSubmit} className="mt-6 border-t border-beige/70 pt-6">
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
              className="rounded-full bg-forest-700 px-4 py-2 text-xs font-medium text-ivory transition hover:bg-forest-800 disabled:opacity-60"
            >
              {savingAction === 'WATERED' ? 'Saving...' : 'Water now'}
            </button>
            <button
              type="button"
              disabled={savingAction !== null}
              onClick={() => void handleQuickAction('FERTILIZED')}
              className="rounded-full border border-forest-700 bg-white px-4 py-2 text-xs font-medium text-forest-800 transition hover:bg-sage-100/60 disabled:opacity-60"
            >
              {savingAction === 'FERTILIZED' ? 'Saving...' : 'Fertilize'}
            </button>
            <button
              type="button"
              disabled={savingAction !== null}
              onClick={() => void handleQuickAction('MISTED')}
              className="rounded-full border border-beige-dark bg-ivory/50 px-4 py-2 text-xs font-medium text-forest-800 transition hover:bg-beige/50 disabled:opacity-60"
            >
              {savingAction === 'MISTED' ? 'Saving...' : 'Mist leaves'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 rounded-3xl border border-beige bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-xl font-semibold text-forest-800">Care history</h2>
        {logs.length === 0 ? (
          <p className="mt-3 text-sm text-forest-700/75">
            No care actions recorded yet. Use the buttons above to log your first watering.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-beige/70">
            {logs.map((entry) => (
              <li key={entry.id} className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <div>
                  <span className="inline-block rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-forest-800">
                    {ACTION_LABELS[entry.action]}
                  </span>
                  {entry.note && <p className="mt-1 text-sm text-forest-800/90">{entry.note}</p>}
                </div>
                <time dateTime={entry.performedAt} className="text-xs text-forest-700/70">
                  {new Date(entry.performedAt).toLocaleDateString('en-US', {
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
