import { ArrowRight, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { CareTask } from '../services/scheduleService'
import type { Plant } from '../types/plant'
import { dueLabel } from './careActionMessages'

interface PlantCardProps {
  plant: Plant
  /** The plant's next watering, if known. */
  waterTask?: CareTask
  onDelete: (plant: Plant) => void
}

/** A plant in the collection: photo, status dot, name, place and conditions. */
export function PlantCard({ plant, waterTask, onDelete }: PlantCardProps) {
  const { t } = useTranslation()
  const attention = waterTask?.status === 'OVERDUE' || waterTask?.status === 'TODAY'

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-beige bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/plants/${plant.id}`} className="relative block h-48 bg-sage-100" aria-label={plant.name}>
        {plant.photoUrl ? (
          <img src={plant.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-5xl" aria-hidden="true">
            🌿
          </span>
        )}
        {waterTask && (
          <span
            className={`absolute top-4 left-4 h-3 w-3 rounded-full ring-4 ring-white/70 ${attention ? 'bg-amber-400' : 'bg-sage-400'}`}
            aria-hidden="true"
          />
        )}
        <span className="absolute right-4 bottom-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-forest-800 shadow transition group-hover:translate-x-0.5">
          <ArrowRight size={17} aria-hidden="true" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-medium text-ink">
              <Link to={`/plants/${plant.id}`} className="hover:underline">
                {plant.name}
              </Link>
            </h2>
            <p className="truncate text-xs text-forest-700/75 italic">{plant.species}</p>
          </div>
          {waterTask && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                attention ? 'bg-amber-100 text-amber-900' : 'bg-mint text-forest-800'
              }`}
            >
              {waterTask.status === 'UPCOMING' ? t('plants.waterIn', { label: dueLabel(t, waterTask) }) : dueLabel(t, waterTask)}
            </span>
          )}
        </div>

        {plant.location && (
          <p className="mt-2 flex items-center gap-1 text-xs text-forest-700/80">
            <MapPin size={13} aria-hidden="true" /> {plant.location}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] text-forest-800">{t(`light.${plant.lightCondition}`)}</span>
          <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] text-forest-800">{t(`pot.${plant.potSize}`)}</span>
          <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] text-forest-800">
            {t(`radiator.${plant.radiatorDistance}`)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-beige/70 pt-3">
          <Link to={`/plants/${plant.id}`} className="text-xs font-medium text-forest-700 hover:text-forest-900">
            {t('plants.viewCareLog')}
          </Link>
          <button
            type="button"
            onClick={() => onDelete(plant)}
            className="text-xs font-medium text-red-700 transition hover:text-red-900"
          >
            {t('plants.removePlant')}
          </button>
        </div>
      </div>
    </article>
  )
}
