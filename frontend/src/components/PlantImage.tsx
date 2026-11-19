import { Sprout } from 'lucide-react'
import type { Plant } from '../types/plant'

/** The plant's photo, or a mint placeholder with a sprout when it has none. */
export function PlantImage({ plant, iconSize = 34 }: { plant: Pick<Plant, 'name' | 'photoUrl'>; iconSize?: number }) {
  return plant.photoUrl ? (
    <img src={plant.photoUrl} alt={plant.name} />
  ) : (
    <div className="plant-placeholder" role="img" aria-label={plant.name}>
      <Sprout size={iconSize} strokeWidth={1.4} />
    </div>
  )
}
