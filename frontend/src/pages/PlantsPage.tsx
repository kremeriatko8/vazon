import { Plus, Search, Sprout } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AddPlantModal } from '../components/AddPlantModal'
import { PageHeading } from '../components/PageHeading'
import { PlantCard } from '../components/PlantCard'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { deletePlant, getPlants } from '../services/plantService'
import { getCareTasks, type CareTask } from '../services/scheduleService'
import type { LightCondition, Plant } from '../types/plant'

interface PlantsPageProps {
  /** /plants/new opens the "add a plant" window straight away. */
  adding?: boolean
}

/** My plants, from MyPlantsPage in the "Extend Design Across Pages" design. */
export function PlantsPage({ adding = false }: PlantsPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { confirm, dialog } = useConfirmDialog()
  const [plants, setPlants] = useState<Plant[]>([])
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [query, setQuery] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('ALL')
  const [selectedLight, setSelectedLight] = useState<'ALL' | LightCondition>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(adding)

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

  function closeModal() {
    setShowModal(false)
    if (adding) navigate('/plants', { replace: true })
  }

  const rooms = Array.from(
    new Set(plants.map((p) => p.location?.trim()).filter((loc): loc is string => Boolean(loc))),
  ).sort((a, b) => a.localeCompare(b))

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

  return (
    <main className="product-page product-shell">
      {dialog}
      <div className="page-title-row">
        <PageHeading kicker={t('plants.collection')} title={t('plants.title')} accent={t('plants.titleEm')} />
        <button type="button" className="app-button" onClick={() => setShowModal(true)}>
          <Plus size={16} /> {t('home.addPlant')}
        </button>
      </div>

      <div className="plant-filters">
        <div className="app-input search">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label={t('plants.searchLabel')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('plants.searchPlaceholder')}
          />
        </div>
        {rooms.length > 0 && (
          <select aria-label={t('plants.filterRoom')} value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
            <option value="ALL">{t('plants.allRooms')}</option>
            {rooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label={t('plants.filterLight')}
          value={selectedLight}
          onChange={(e) => setSelectedLight(e.target.value as 'ALL' | LightCondition)}
        >
          <option value="ALL">{t('plants.allLight')}</option>
          <option value="LOW">{t('light.LOW')}</option>
          <option value="MEDIUM">{t('light.MEDIUM')}</option>
          <option value="BRIGHT_INDIRECT">{t('light.BRIGHT_INDIRECT')}</option>
          <option value="DIRECT">{t('light.DIRECT')}</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[#778178]">{t('plants.loading')}</p>
      ) : (
        <div className="product-plant-grid">
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
      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <Sprout />
          <h2>{plants.length === 0 ? t('plants.noPlantsYet') : t('plants.noMatching')}</h2>
          <p>{plants.length === 0 ? t('plants.emptyHint') : t('plants.filterHint')}</p>
        </div>
      )}

      {showModal && (
        <AddPlantModal
          onClose={closeModal}
          rooms={rooms}
          initialSearch={params.get('search') ?? ''}
          onCreated={(plant) => navigate(`/plants/${plant.id}`, { replace: adding })}
        />
      )}
    </main>
  )
}
