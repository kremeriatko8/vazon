import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PlantCard } from '../components/PlantCard'
import { deletePlant, getPlants } from '../services/plantService'
import type { LightCondition, Plant } from '../types/plant'

export function PlantsPage() {
  const { t } = useTranslation()
  const [plants, setPlants] = useState<Plant[]>([])
  const [query, setQuery] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('ALL')
  const [selectedLight, setSelectedLight] = useState<'ALL' | LightCondition>('ALL')
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

  const rooms = Array.from(
    new Set(plants.map((p) => p.location?.trim()).filter((loc): loc is string => Boolean(loc))),
  ).sort((a, b) => a.localeCompare(b))

  const hasActiveFilters = query.trim() !== '' || selectedRoom !== 'ALL' || selectedLight !== 'ALL'

  const filtered = plants.filter((plant) => {
    if (selectedRoom !== 'ALL' && (plant.location?.trim() ?? '') !== selectedRoom) {
      return false
    }
    if (selectedLight !== 'ALL' && plant.lightCondition !== selectedLight) {
      return false
    }
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      plant.name.toLowerCase().includes(q) ||
      plant.species.toLowerCase().includes(q) ||
      (plant.location?.toLowerCase().includes(q) ?? false)
    )
  })

  function clearFilters() {
    setQuery('')
    setSelectedRoom('ALL')
    setSelectedLight('ALL')
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">{t('plants.collection')}</p>
          <h1 className="page-title mt-1 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-forest-800">{t('plants.title')}</h1>
        </div>
        <Link
          to="/plants/new"
          className="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium whitespace-nowrap text-ivory motion-safe:transition-colors hover:bg-forest-800 sm:w-auto"
        >
          {t('plants.addPlant')}
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label htmlFor="plant-search" className="sr-only">Search plants</label>
        <input
          id="plant-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('plants.searchPlaceholder')}
          className="w-full rounded-full border border-beige-dark bg-white px-4 py-2 text-sm text-forest-900 focus:border-forest-600 focus:outline-none sm:max-w-xs"
        />

        {rooms.length > 0 && (
          <>
            <label htmlFor="filter-room" className="sr-only">Filter by room</label>
            <select
              id="filter-room"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full rounded-full border border-beige-dark bg-white px-4 py-2 text-sm text-forest-900 focus:border-forest-600 focus:outline-none sm:w-auto"
            >
              <option value="ALL">{t('plants.allRooms')}</option>
              {rooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </>
        )}

        <label htmlFor="filter-light" className="sr-only">Filter by light level</label>
        <select
          id="filter-light"
          value={selectedLight}
          onChange={(e) => setSelectedLight(e.target.value as 'ALL' | LightCondition)}
          className="w-full rounded-full border border-beige-dark bg-white px-4 py-2 text-sm text-forest-900 focus:border-forest-600 focus:outline-none sm:w-auto"
        >
          <option value="ALL">{t('plants.allLight')}</option>
          <option value="LOW">{t('light.LOW')}</option>
          <option value="MEDIUM">{t('light.MEDIUM')}</option>
          <option value="BRIGHT_INDIRECT">{t('light.BRIGHT_INDIRECT')}</option>
          <option value="DIRECT">{t('light.DIRECT')}</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-forest-700 hover:text-forest-900 hover:underline"
          >
            {t('plants.clearFilters')}
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-forest-700/75">Loading your plants...</p>
      ) : filtered.length === 0 ? (
        <div className="leaf-empty card-reveal mt-8 rounded-3xl border border-beige bg-paper p-8 text-center shadow-botanical">
          <p className="font-display text-xl text-forest-800">
            {plants.length === 0 ? t('plants.noPlantsYet') : t('plants.noMatching')}
          </p>
          <p className="mt-1 text-sm text-forest-700/75">
            {plants.length === 0 ? t('plants.emptyHint') : t('plants.filterHint')}
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
