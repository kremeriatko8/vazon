import { apiClient } from './apiClient'
import type { Plant } from '../types/plant'

export type PlantStatus = 'HEALTHY' | 'NEEDS_ATTENTION' | 'DEAD'

export interface LocalizedText {
  en: string
  uk: string
}

export interface Symptom {
  code: string
  title: LocalizedText
}

export interface DiagnosisCause {
  cause: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  score: number
  title: LocalizedText
  reasons: LocalizedText[]
  actions: LocalizedText[]
}

export interface Diagnosis {
  plantId: string
  symptoms: string[]
  causes: DiagnosisCause[]
  suggestedStatus: PlantStatus
}

export function setPlantStatus(plantId: string, status: PlantStatus): Promise<Plant> {
  return apiClient.put<Plant>(`/plants/${plantId}/status`, { status })
}

export function getSymptoms(): Promise<Symptom[]> {
  return apiClient.get<Symptom[]>('/symptoms')
}

export function diagnosePlant(plantId: string, symptoms: string[]): Promise<Diagnosis> {
  return apiClient.post<Diagnosis>(`/plants/${plantId}/diagnosis`, { symptoms })
}

/** The text in the interface language. */
export function localized(text: LocalizedText, language: string): string {
  return language === 'uk' ? text.uk : text.en
}
