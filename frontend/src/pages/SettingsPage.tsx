import { Bell, Check, Languages, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeading } from '../components/PageHeading'
import { useAuth } from '../hooks/useAuth'
import { setAppLanguage } from '../i18n'
import { getSettings, updateSettings, type UserSettings } from '../services/settingsService'

function Toggle({ value, onChange, label, disabled }: { value: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={`switch ${value ? 'on' : ''}`}
      onClick={onChange}
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled}
    >
      <span />
    </button>
  )
}

/** Settings, from SettingsPage in the "Extend Design Across Pages" design, saved through /me/settings. */
export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const currentLang = i18n.language === 'uk' ? 'uk' : 'en'

  useEffect(() => {
    let active = true
    getSettings()
      .then((data) => {
        if (active) setSettings(data)
      })
      .catch(() => {
        if (active) setError(t('settings.loadFailed'))
      })
    return () => {
      active = false
    }
  }, [t])

  async function chooseLanguage(language: 'uk' | 'en') {
    setAppLanguage(language)
    try {
      setSettings(await updateSettings({ language }))
    } catch {
      // The interface language still changes in this browser.
    }
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    setError(null)
    try {
      const { remindersEnabled, reminderTime, dayBeforeAlert, emailDigest } = settings
      setSettings(await updateSettings({ remindersEnabled, reminderTime, dayBeforeAlert, emailDigest }))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2200)
    } catch {
      setError(t('settings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const set = (changes: Partial<UserSettings>) => setSettings((s) => (s ? { ...s, ...changes } : s))
  const off = !settings?.remindersEnabled

  return (
    <main className="product-page settings-page product-shell">
      <PageHeading kicker={t('settings.kicker')} title={t('settings.title')} accent={t('settings.titleEm')} description={user?.email} />

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <section className="settings-card">
        <div className="settings-title">
          <span>
            <Languages />
          </span>
          <div>
            <h2>{t('settings.languageTitle')}</h2>
            <p>{t('settings.languageHint')}</p>
          </div>
        </div>
        <div className="choice-row" role="group" aria-label={t('settings.languageTitle')}>
          {(['en', 'uk'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              className={currentLang === lang ? 'selected' : ''}
              aria-pressed={currentLang === lang}
              onClick={() => void chooseLanguage(lang)}
            >
              {currentLang === lang && <Check size={15} />}
              {lang === 'uk' ? 'Українська' : 'English'}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-title">
          <span>
            <Bell />
          </span>
          <div>
            <h2>{t('settings.remindersTitle')}</h2>
            <p>{t('settings.remindersHint')}</p>
          </div>
        </div>
        {!settings ? (
          !error && <p className="text-sm text-[#778178]">{t('settings.loading')}</p>
        ) : (
          <div className="setting-rows">
            <div>
              <div>
                <strong>{t('settings.daily')}</strong>
                <small>{t('settings.dailyHint')}</small>
              </div>
              <Toggle
                value={settings.remindersEnabled}
                onChange={() => set({ remindersEnabled: !settings.remindersEnabled })}
                label={t('settings.daily')}
              />
            </div>
            <div className={off ? 'opacity-50' : ''}>
              <div>
                <strong>
                  <label htmlFor="reminder-time">{t('settings.time')}</label>
                </strong>
                <small>{t('settings.timeHint')}</small>
              </div>
              <label className="time-control">
                <input
                  id="reminder-time"
                  type="time"
                  disabled={off}
                  value={settings.reminderTime}
                  onChange={(e) => set({ reminderTime: e.target.value })}
                  className="bg-transparent outline-none"
                />
              </label>
            </div>
            <div className={off ? 'opacity-50' : ''}>
              <div>
                <strong>{t('settings.dayBefore')}</strong>
                <small>{t('settings.dayBeforeHint')}</small>
              </div>
              <Toggle
                value={settings.dayBeforeAlert}
                disabled={off}
                onChange={() => set({ dayBeforeAlert: !settings.dayBeforeAlert })}
                label={t('settings.dayBefore')}
              />
            </div>
            <div className={off ? 'opacity-50' : ''}>
              <div>
                <strong>{t('settings.email')}</strong>
                <small>{t('settings.emailHint')}</small>
              </div>
              <Toggle
                value={settings.emailDigest}
                disabled={off}
                onChange={() => set({ emailDigest: !settings.emailDigest })}
                label={t('settings.email')}
              />
            </div>
          </div>
        )}
      </section>

      <section className="settings-card compact">
        <div className="settings-title">
          <span>
            <SlidersHorizontal />
          </span>
          <div>
            <h2>{t('settings.saveTitle')}</h2>
            <p>{t('settings.saveHint')}</p>
          </div>
        </div>
        <button type="button" className="app-button" disabled={saving || !settings} onClick={() => void save()}>
          {saved ? (
            <>
              <Check size={16} /> {t('settings.saved')}
            </>
          ) : saving ? (
            t('care.saving')
          ) : (
            t('settings.save')
          )}
        </button>
      </section>
    </main>
  )
}
