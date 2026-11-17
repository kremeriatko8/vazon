import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlantCard } from '../components/PlantCard'
import { deletePlant, getPlants } from '../services/plantService'
import type { Plant } from '../types/plant'

export function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getPlants()
      .then((data) => {
        if (active) setPlants(data)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load plants.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id: string) {
    try {
      await deletePlant(id)
      setPlants((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove plant.')
    }
  }

  const filtered = plants.filter((plant) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      plant.name.toLowerCase().includes(q) ||
      (plant.species?.toLowerCase().includes(q) ?? false) ||
      (plant.location?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">Collection</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-forest-800">My plants</h1>
        </div>
        <Link
          to="/plants/new"
          className="inline-flex items-center justify-center rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-ivory transition hover:bg-forest-800"
        >
          + Add plant
        </Link>
      </div>

      <div className="mt-6">
        <label htmlFor="plant-search" className="sr-only">Search plants</label>
        <input
          id="plant-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, species, or room..."
          className="w-full max-w-md rounded-full border border-beige-dark bg-white px-4 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:outline-none"
        />
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-forest-700/75">Loading your plants...</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-beige bg-white p-8 text-center">
          <p className="font-display text-xl text-forest-800">
            {plants.length === 0 ? 'No plants yet' : 'No matching plants'}
          </p>
          <p className="mt-1 text-sm text-forest-700/75">
            {plants.length === 0
              ? 'Add your first houseplant to start tracking watering and care.'
              : 'Try a different search term or clear your filter.'}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plant) => (
            <PlantCard key={plant.id} plant={plant} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </section>
  )
}
