import { ArrowRight, MapPin, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import type { CareTask } from '../services/scheduleService'
import type { Plant } from '../types/plant'
import { dueLabel } from './careActionMessages'
import { PlantImage } from './PlantImage'

interface PlantCardProps {
  plant: Plant
  /** The plant's next watering, if known. */
  waterTask?: CareTask
  onDelete: (plant: Plant) => void
}

/** A plant in the collection (product-plant-card from the design). */
export function PlantCard({ plant, waterTask, onDelete }: PlantCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const open = () => navigate(`/plants/${plant.id}`)
  const attention = waterTask?.status === 'OVERDUE' || waterTask?.status === 'TODAY'

  return (
    <article className="product-plant-card">
      <div className="product-plant-image">
        <PlantImage plant={plant} iconSize={46} />
        {waterTask && <span className={attention ? 'attention' : ''} aria-hidden="true" />}
        <button type="button" onClick={open} aria-label={plant.name}>
          <ArrowRight size={18} />
        </button>
      </div>
      <div className="product-plant-copy">
        <div className="plant-name-line">
          <div>
            <h2>
              <Link to={`/plants/${plant.id}`}>{plant.name}</Link>
            </h2>
            <em>{plant.species}</em>
          </div>
          {waterTask && <span>{dueLabel(t, waterTask)}</span>}
        </div>
        {plant.location && (
          <p>
            <MapPin size={13} aria-hidden="true" />
            {plant.location}
          </p>
        )}
        <div className="plant-tags">
          <span>{t(`light.${plant.lightCondition}`)}</span>
          <span>{t(`pot.${plant.potSize}`)}</span>
        </div>
        <div className="plant-card-actions">
          <button type="button" onClick={open}>
            {t('plants.careJournal')} <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => onDelete(plant)} aria-label={`${t('plants.removePlant')}: ${plant.name}`}>
            <Trash2 size={14} /> {t('plants.removePlant')}
          </button>
        </div>
      </div>
    </article>
  )
}
