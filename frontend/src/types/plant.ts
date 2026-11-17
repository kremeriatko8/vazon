export type LightLevel = 'LOW' | 'MEDIUM' | 'BRIGHT_INDIRECT' | 'DIRECT'
export type CareActionType = 'WATERED' | 'FERTILIZED' | 'MISTED' | 'REPOTTED'

export interface CareLog {
  id: string
  plantId: string
  action: CareActionType
  performedAt: string
  note: string | null
}

export interface Plant {
  id: string
  userId: string
  name: string
  species: string | null
  location: string | null
  lightLevel: LightLevel
  wateringIntervalDays: number
  fertilizingIntervalDays: number | null
  notes: string | null
  photoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePlantInput {
  name: string
  species?: string
  location?: string
  lightLevel: LightLevel
  wateringIntervalDays: number
  fertilizingIntervalDays?: number | null
  notes?: string
}
