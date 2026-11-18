import { apiClient } from './apiClient'
import type { CreatePlantInput, Plant, UpdatePlantInput } from '../types/plant'

export async function getPlants(): Promise<Plant[]> {
  return apiClient.get<Plant[]>('/plants')
}

export async function createPlant(input: CreatePlantInput): Promise<Plant> {
  return apiClient.post<Plant>('/plants', input)
}

export async function deletePlant(id: string): Promise<void> {
  await apiClient.delete(`/plants/${id}`)
}

export async function getPlantById(id: string): Promise<Plant | null> {
  return apiClient.get<Plant>(`/plants/${id}`)
}

export async function updatePlant(id: string, input: UpdatePlantInput): Promise<Plant> {
  return apiClient.patch<Plant>(`/plants/${id}`, input)
}

/** JPEG, PNG or WebP up to 5 MB, the same limits as the backend. */
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

/** Why a file cannot be uploaded as a plant photo, or null if it can. */
export function photoProblem(file: File): 'type' | 'size' | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'type'
  if (file.size > MAX_PHOTO_BYTES) return 'size'
  return null
}

/** Uploads or replaces the plant's photo (multipart field "photo"). */
export async function uploadPlantPhoto(id: string, file: File): Promise<Plant> {
  const form = new FormData()
  form.append('photo', file)
  return apiClient.postForm<Plant>(`/plants/${id}/photo`, form)
}

export async function removePlantPhoto(id: string): Promise<Plant> {
  return apiClient.delete<Plant>(`/plants/${id}/photo`)
}
