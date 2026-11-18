import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Plant } from '../types/plant'

interface PlantCardProps {
  plant: Plant
  onDelete: (id: string) => void
}

export function PlantCard({ plant, onDelete }: PlantCardProps) {
  const { t } = useTranslation()

  return (
    <article className="flex flex-col justify-between overflow-hidden rounded-3xl border border-beige bg-white shadow-sm transition hover:border-forest-600/40">
      {plant.photoUrl && (
        <Link to={`/plants/${plant.id}`} className="block h-40 w-full overflow-hidden bg-sage-100/50">
          <img
            src={plant.photoUrl}
            alt={plant.name}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-semibold text-forest-800">
                <Link to={`/plants/${plant.id}`} className="hover:underline">
                  {plant.name}
                </Link>
              </h2>
              <p className="truncate text-xs italic text-forest-700/75">{plant.species}</p>
            </div>
            <span className="shrink-0 rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-forest-800">
              {t(`light.${plant.lightCondition}`)}
            </span>
          </div>

          <dl className="mt-4 space-y-1.5 text-sm text-forest-700/90">
            <div className="flex justify-between gap-2">
              <dt className="text-forest-700/70">Pot</dt>
              <dd className="font-medium text-forest-900">{t(`pot.${plant.potSize}`)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-forest-700/70">Radiator</dt>
              <dd className="font-medium text-forest-900">{t(`radiator.${plant.radiatorDistance}`)}</dd>
            </div>
            {plant.location && (
              <div className="flex justify-between gap-2">
                <dt className="text-forest-700/70">Location</dt>
                <dd className="font-medium text-forest-900">{plant.location}</dd>
              </div>
            )}
          </dl>

          {plant.notes && (
            <p className="mt-3 rounded-2xl bg-ivory/70 px-3 py-2 text-xs text-forest-800/85">
              {plant.notes}
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-beige/70 pt-3">
          <Link to={`/plants/${plant.id}`} className="text-xs font-medium text-forest-700 hover:text-forest-900">
            {t('plants.viewCareLog')}
          </Link>
          <button
            type="button"
            onClick={() => onDelete(plant.id)}
            className="text-xs font-medium text-red-700 transition hover:text-red-900"
          >
            {t('plants.removePlant')}
          </button>
        </div>
      </div>
    </article>
  )
}
