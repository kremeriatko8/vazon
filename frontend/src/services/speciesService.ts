import { apiClient } from './apiClient'
import type { LightCondition } from '../types/plant'

/** A catalog species from GET /api/v1/species. */
export interface Species {
  id: string
  scientificName: string
  commonName: string
  recommendedLight: LightCondition
  photoUrl: string | null
  /** Required by the photo licence whenever photoUrl is shown. */
  photoAttribution: string | null
  photoSourceUrl: string | null
}

export async function searchSpecies(search: string, limit = 8): Promise<Species[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  const term = search.trim().slice(0, 100)
  if (term) params.set('search', term)
  return apiClient.get<Species[]>(`/species?${params.toString()}`)
}
