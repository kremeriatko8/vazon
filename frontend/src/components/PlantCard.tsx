import type { LightLevel, Plant } from '../types/plant'

const LIGHT_LABELS: Record<LightLevel, string> = {
  LOW: 'Low light',
  MEDIUM: 'Medium light',
  BRIGHT_INDIRECT: 'Bright indirect',
  DIRECT: 'Direct sun',
}

interface PlantCardProps {
  plant: Plant
  onDelete: (id: string) => void
}

export function PlantCard({ plant, onDelete }: PlantCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-3xl border border-beige bg-white p-5 shadow-sm transition hover:border-forest-600/40">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest-800">{plant.name}</h2>
            {plant.species && <p className="text-xs italic text-forest-700/75">{plant.species}</p>}
          </div>
          <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-forest-800">
            {LIGHT_LABELS[plant.lightLevel]}
          </span>
        </div>

        <dl className="mt-4 space-y-1.5 text-sm text-forest-700/90">
          {plant.location && (
            <div className="flex justify-between">
              <dt className="text-forest-700/70">Location</dt>
              <dd className="font-medium text-forest-900">{plant.location}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-forest-700/70">Watering</dt>
            <dd className="font-medium text-forest-900">Every {plant.wateringIntervalDays} d</dd>
          </div>
          {plant.fertilizingIntervalDays && (
            <div className="flex justify-between">
              <dt className="text-forest-700/70">Fertilizing</dt>
              <dd className="font-medium text-forest-900">Every {plant.fertilizingIntervalDays} d</dd>
            </div>
          )}
        </dl>

        {plant.notes && (
          <p className="mt-3 rounded-2xl bg-ivory/70 px-3 py-2 text-xs text-forest-800/85">
            {plant.notes}
          </p>
        )}
      </div>

      <div className="mt-5 flex justify-end border-t border-beige/70 pt-3">
        <button
          type="button"
          onClick={() => onDelete(plant.id)}
          className="text-xs font-medium text-red-700 transition hover:text-red-900"
        >
          Remove plant
        </button>
      </div>
    </article>
  )
}
