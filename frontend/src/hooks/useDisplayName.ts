import { useEffect, useState } from 'react'
import { getSettings, greetingName, onSettingsChanged } from '../services/settingsService'
import { useAuth } from './useAuth'

/**
 * The signed-in user's name: the display name from settings, else the part of
 * the email before "@". Updates as soon as settings are saved anywhere.
 */
export function useDisplayName(): string {
  const { isAuthenticated, user } = useAuth()
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    getSettings()
      .then((settings) => {
        if (!cancelled) setDisplayName(settings.displayName)
      })
      .catch(() => undefined)
    const stop = onSettingsChanged((settings) => setDisplayName(settings.displayName))
    return () => {
      cancelled = true
      stop()
    }
  }, [isAuthenticated, user?.id])

  return isAuthenticated ? greetingName({ displayName }, user?.email) : ''
}
