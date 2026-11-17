import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPlant } from '../services/plantService'
import type { LightLevel } from '../types/plant'

export function NewPlantPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [location, setLocation] = useState('')
  const [lightLevel, setLightLevel] = useState<LightLevel>('BRIGHT_INDIRECT')
  const [wateringIntervalDays, setWateringIntervalDays] = useState('7')
  const [fertilizingIntervalDays, setFertilizingIntervalDays] = useState('30')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Please enter a plant name.')
      return
    }
    const watering = Number(wateringIntervalDays)
    if (!Number.isInteger(watering) || watering < 1) {
      setError('Watering interval must be at least 1 day.')
      return
    }
    const fertilizing = fertilizingIntervalDays.trim() ? Number(fertilizingIntervalDays) : null
    if (fertilizing !== null && (!Number.isInteger(fertilizing) || fertilizing < 1)) {
      setError('Fertilizing interval must be at least 1 day or left blank.')
      return
    }

    setSubmitting(true)
    try {
      await createPlant({
        name,
        species,
        location,
        lightLevel,
        wateringIntervalDays: watering,
        fertilizingIntervalDays: fertilizing,
        notes,
      })
      navigate('/plants', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save plant.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-10">
      <Link to="/plants" className="text-sm font-medium text-forest-700 hover:text-forest-900">
        ← Back to my plants
      </Link>
      <div className="mt-4 rounded-3xl border border-beige bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">New plant</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-forest-800">Add a houseplant</h1>

        {error && (
          <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="plant-name" className="block text-sm font-medium text-forest-800">Plant name *</label>
            <input
              id="plant-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fiddle Leaf Fig"
              className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="plant-species" className="block text-sm font-medium text-forest-800">Species</label>
              <input
                id="plant-species"
                type="text"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="Ficus lyrata"
                className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="plant-location" className="block text-sm font-medium text-forest-800">Room / Location</label>
              <input
                id="plant-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Living room"
                className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="plant-light" className="block text-sm font-medium text-forest-800">Light level</label>
            <select
              id="plant-light"
              value={lightLevel}
              onChange={(e) => setLightLevel(e.target.value as LightLevel)}
              className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
            >
              <option value="LOW">Low light</option>
              <option value="MEDIUM">Medium light</option>
              <option value="BRIGHT_INDIRECT">Bright indirect</option>
              <option value="DIRECT">Direct sun</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="plant-watering" className="block text-sm font-medium text-forest-800">Water every (days) *</label>
              <input
                id="plant-watering"
                type="number"
                min="1"
                required
                value={wateringIntervalDays}
                onChange={(e) => setWateringIntervalDays(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="plant-fertilizing" className="block text-sm font-medium text-forest-800">Fertilize every (days)</label>
              <input
                id="plant-fertilizing"
                type="number"
                min="1"
                value={fertilizingIntervalDays}
                onChange={(e) => setFertilizingIntervalDays(e.target.value)}
                placeholder="Optional"
                className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="plant-notes" className="block text-sm font-medium text-forest-800">Care notes</label>
            <textarea
              id="plant-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Soil type, misting preferences..."
              className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-forest-700 px-5 py-3 text-sm font-medium text-ivory transition hover:bg-forest-800 disabled:opacity-60"
          >
            {submitting ? 'Saving plant...' : 'Save plant'}
          </button>
        </form>
      </div>
    </section>
  )
}
