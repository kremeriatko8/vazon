import { Plus, Search, Sprout } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { PlantCard } from '../components/PlantCard'
import { ui } from '../components/styles'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { deletePlant, getPlants } from '../services/plantService'
import { getCareTasks, type CareTask } from '../services/scheduleService'
import type { LightCondition, Plant } from '../types/plant'

const filterClass =
  'w-full rounded-full border border-beige-dark bg-white px-4 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:outline-none sm:w-auto'

export function PlantsPage() {
  const { t } = useTranslation()
  const { confirm, dialog } = useConfirmDialog()
  const [plants, setPlants] = useState<Plant[]>([])
  const [tasks, setTasks] = useState<CareTask[]>([])
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
        if (active) setError(err instanceof Error ? err.message : t('plants.loadFailed'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    // Status chips are a bonus: the list still works if the schedule fails.
    getCareTasks()
      .then((list) => {
        if (active) setTasks(list)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [t])

  async function handleDelete(plant: Plant) {
    const ok = await confirm({
      title: t('plants.removeTitle', { plant: plant.name }),
      message: t('plants.removeMessage'),
      confirmLabel: t('plants.removeConfirm'),
      cancelLabel: t('care.tooEarly.cancel'),
    })
    if (!ok) return
    try {
      await deletePlant(plant.id)
      setPlants((prev) => prev.filter((p) => p.id !== plant.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('plants.removeFailed'))
    }
  }

  const rooms = Array.from(
    new Set(plants.map((p) => p.location?.trim()).filter((loc): loc is string => Boolean(loc))),
  ).sort((a, b) => a.localeCompare(b))

  const hasActiveFilters = query.trim() !== '' || selectedRoom !== 'ALL' || selectedLight !== 'ALL'

  const filtered = plants.filter((plant) => {
    if (selectedRoom !== 'ALL' && (plant.location?.trim() ?? '') !== selectedRoom) return false
    if (selectedLight !== 'ALL' && plant.lightCondition !== selectedLight) return false
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
    <section className="mx-auto max-w-6xl px-4 py-12">
      {dialog}
      <PageHeader kicker={t('plants.collection')} title={t('plants.title')} titleEm={t('plants.titleEm')}>
        <Link to="/plants/new" className={ui.btnPrimary}>
          <Plus size={16} aria-hidden="true" /> {t('plants.addPlant')}
        </Link>
      </PageHeader>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex w-full items-center gap-2 rounded-full border border-beige-dark bg-white px-4 focus-within:border-forest-600 sm:max-w-xs">
          <Search size={16} className="text-forest-700/60" aria-hidden="true" />
          <label htmlFor="plant-search" className="sr-only">
            {t('plants.searchLabel')}
          </label>
          <input
            id="plant-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('plants.searchPlaceholder')}
            className="w-full bg-transparent py-2.5 text-sm text-forest-900 outline-none"
          />
        </div>

        {rooms.length > 0 && (
          <>
            <label htmlFor="filter-room" className="sr-only">
              {t('plants.filterRoom')}
            </label>
            <select id="filter-room" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className={filterClass}>
              <option value="ALL">{t('plants.allRooms')}</option>
              {rooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </>
        )}

        <label htmlFor="filter-light" className="sr-only">
          {t('plants.filterLight')}
        </label>
        <select
          id="filter-light"
          value={selectedLight}
          onChange={(e) => setSelectedLight(e.target.value as 'ALL' | LightCondition)}
          className={filterClass}
        >
          <option value="ALL">{t('plants.allLight')}</option>
          <option value="LOW">{t('light.LOW')}</option>
          <option value="MEDIUM">{t('light.MEDIUM')}</option>
          <option value="BRIGHT_INDIRECT">{t('light.BRIGHT_INDIRECT')}</option>
          <option value="DIRECT">{t('light.DIRECT')}</option>
        </select>

        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-xs font-medium text-forest-700 hover:text-forest-900 hover:underline">
            {t('plants.clearFilters')}
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className={`mt-6 ${ui.error}`}>
          {error}
        </div>
      )}

      {loading ? (
        <p className={`mt-10 ${ui.muted}`}>{t('plants.loading')}</p>
      ) : filtered.length === 0 ? (
        <div className={`mt-10 flex flex-col items-center p-10 text-center ${ui.card}`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-olive-800">
            <Sprout size={26} aria-hidden="true" />
          </span>
          <p className="mt-4 font-display text-2xl text-ink">
            {plants.length === 0 ? t('plants.noPlantsYet') : t('plants.noMatching')}
          </p>
          <p className={`mt-1 ${ui.muted}`}>{plants.length === 0 ? t('plants.emptyHint') : t('plants.filterHint')}</p>
          {plants.length === 0 && (
            <Link to="/plants/new" className={`mt-6 ${ui.btnPrimary}`}>
              <Plus size={16} aria-hidden="true" /> {t('plants.addPlant')}
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              waterTask={tasks.find((task) => task.plantId === plant.id && task.action === 'WATERED')}
              onDelete={(p) => void handleDelete(p)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
