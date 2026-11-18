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
