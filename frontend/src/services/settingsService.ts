import { apiClient } from './apiClient'

/** The settings object of GET/PATCH /api/v1/me/settings. */
export interface UserSettings {
  /** How the app greets the user; null means not set. */
  displayName: string | null
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

/** The name to greet the user with: their display name, else the part of the email before "@". */
export function greetingName(settings: Pick<UserSettings, 'displayName'> | null, email: string | undefined): string {
  return settings?.displayName?.trim() || (email ? email.split('@')[0] : '')
}

const SETTINGS_EVENT = 'vazon:settings-changed'

/** Tells every open page that settings changed (e.g. the name in the header). */
export function announceSettings(settings: UserSettings): void {
  window.dispatchEvent(new CustomEvent<UserSettings>(SETTINGS_EVENT, { detail: settings }))
}

export function onSettingsChanged(listener: (settings: UserSettings) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<UserSettings>).detail)
  window.addEventListener(SETTINGS_EVENT, handler)
  return () => window.removeEventListener(SETTINGS_EVENT, handler)
}
