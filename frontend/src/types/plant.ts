export type LightLevel = 'LOW' | 'MEDIUM' | 'BRIGHT_INDIRECT' | 'DIRECT'

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
