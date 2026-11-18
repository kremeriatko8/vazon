import { apiClient } from './apiClient'
import type { CreatePlantInput, UpdatePlantInput, Plant } from '../types/plant'

const STORAGE_KEY = 'vazon_plants'
const USE_MOCK = import.meta.env.VITE_USE_MOCK_PLANTS !== 'false'

const seedPlants: Plant[] = [
  {
    id: 'plant-1',
    userId: 'demo',
    name: 'Monstera Deliciosa',
    species: 'Monstera deliciosa',
    location: 'Living room window',
    lightLevel: 'BRIGHT_INDIRECT',
    wateringIntervalDays: 7,
    fertilizingIntervalDays: 30,
    notes: 'Mist leaves weekly; rotate pot every month.',
    photoUrl: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'plant-2',
    userId: 'demo',
    name: 'Snake Plant',
    species: 'Dracaena trifasciata',
    location: 'Bedroom corner',
    lightLevel: 'LOW',
    wateringIntervalDays: 14,
    fertilizingIntervalDays: 60,
    notes: 'Let soil dry out completely between waterings.',
    photoUrl: null,
    createdAt: '2026-10-05T12:00:00.000Z',
    updatedAt: '2026-10-05T12:00:00.000Z',
  },
]

function loadMockPlants(): Plant[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPlants))
    return seedPlants
  }
  return JSON.parse(raw) as Plant[]
}

export async function getPlants(): Promise<Plant[]> {
  if (!USE_MOCK) return apiClient.get<Plant[]>('/plants')
  return loadMockPlants()
}

export async function createPlant(input: CreatePlantInput): Promise<Plant> {
  if (!USE_MOCK) return apiClient.post<Plant>('/plants', input)
  const plants = loadMockPlants()
  const now = new Date().toISOString()
  const created: Plant = {
    id: crypto.randomUUID(),
    userId: 'demo',
    name: input.name.trim(),
    species: input.species?.trim() || null,
    location: input.location?.trim() || null,
    lightLevel: input.lightLevel,
    wateringIntervalDays: input.wateringIntervalDays,
    fertilizingIntervalDays: input.fertilizingIntervalDays ?? null,
    notes: input.notes?.trim() || null,
    photoUrl: null,
    createdAt: now,
    updatedAt: now,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([created, ...plants]))
  return created
}

export async function deletePlant(id: string): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.delete(`/plants/${id}`)
    return
  }
  const updated = loadMockPlants().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export async function getPlantById(id: string): Promise<Plant | null> {
  if (!USE_MOCK) return apiClient.get<Plant>(`/plants/${id}`)
  return loadMockPlants().find((p) => p.id === id) ?? null
}

export async function updatePlant(id: string, input: UpdatePlantInput): Promise<Plant> {
  if (!USE_MOCK) return apiClient.patch<Plant>(`/plants/${id}`, input)
  const plants = loadMockPlants()
  const index = plants.findIndex((p) => p.id === id)
  if (index === -1) throw new Error('Plant not found.')
  const existing = plants[index]
  const updated: Plant = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    species: input.species !== undefined ? input.species.trim() || null : existing.species,
    location: input.location !== undefined ? input.location.trim() || null : existing.location,
    lightLevel: input.lightLevel ?? existing.lightLevel,
    wateringIntervalDays: input.wateringIntervalDays ?? existing.wateringIntervalDays,
    fertilizingIntervalDays:
      input.fertilizingIntervalDays !== undefined
        ? input.fertilizingIntervalDays
        : existing.fertilizingIntervalDays,
    notes: input.notes !== undefined ? input.notes.trim() || null : existing.notes,
    updatedAt: new Date().toISOString(),
  }
  const next = [...plants]
  next[index] = updated
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return updated
}
