export type LightCondition = 'LOW' | 'MEDIUM' | 'BRIGHT_INDIRECT' | 'DIRECT'

export type PotSize = 'SMALL' | 'MEDIUM' | 'LARGE'

export type RadiatorDistance = 'NEAR' | 'MEDIUM' | 'FAR' | 'NONE'

export type CareTaskType = 'WATER' | 'FEED' | 'REPOT'

export type CareTaskStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED'

export type CareActionType = 'WATERED' | 'FED' | 'REPOTTED' | 'SOIL_WET'

export interface CareLog {
  id: string
  plantId: string
  careTaskId?: string | null
  actionType: CareActionType
  actionDate: string
  notes: string | null
  createdAt?: string
}

export interface ApiCareTask {
  id: string
  plantId: string
  taskType: CareTaskType
  scheduledDate: string
  status: CareTaskStatus
  completedAt: string | null
}

export interface Plant {
  id: string
  ownerId: string
  name: string
  species: string
  lightCondition: LightCondition
  potSize: PotSize
  radiatorDistance: RadiatorDistance
  speciesId?: string | null
  location?: string | null
  wateringIntervalDays?: number
  fertilizingIntervalDays?: number | null
  notes?: string | null
  photoUrl?: string | null
  status?: 'HEALTHY' | 'NEEDS_ATTENTION' | 'DEAD'
  statusChangedAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreatePlantInput {
  name: string
  species: string
  lightCondition: LightCondition
  potSize: PotSize
  radiatorDistance: RadiatorDistance
  /** Catalog species, from GET /species. Omitted when the owner does not know the species. */
  speciesId?: string | null
  location?: string | null
  notes?: string | null
  fertilizingIntervalDays?: number | null
}

export type UpdatePlantInput = Partial<CreatePlantInput>
