import { apiClient } from './apiClient'

/** The settings object of GET/PATCH /api/v1/me/settings. */
export interface UserSettings {
  language: 'uk' | 'en'
  remindersEnabled: boolean
  /** "HH:MM", Europe/Kyiv. */
  reminderTime: string
  dayBeforeAlert: boolean
  emailDigest: boolean
}

export async function getSettings(): Promise<UserSettings> {
  return apiClient.get<UserSettings>('/me/settings')
}

/** Saves only the fields that are sent. */
export async function updateSettings(changes: Partial<UserSettings>): Promise<UserSettings> {
  return apiClient.patch<UserSettings>('/me/settings', changes)
}
