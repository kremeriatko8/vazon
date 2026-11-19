import { Bell, Check, Languages, Mail } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/PageHeader'
import { ui } from '../components/styles'
import { useAuth } from '../hooks/useAuth'
import { setAppLanguage } from '../i18n'
import { getSettings, updateSettings, type UserSettings } from '../services/settingsService'

function Toggle({
  id,
  checked,
  disabled,
  onChange,
  title,
  hint,
}: {
  id: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
  title: string
  hint: string
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-beige bg-ivory/40 px-4 py-3.5 ${disabled ? 'opacity-50' : ''}`}
    >
      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block text-xs text-forest-700/75">{hint}</span>
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className="relative h-6 w-11 shrink-0 rounded-full bg-beige-dark transition peer-checked:bg-olive-800 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest-600 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
        aria-hidden="true"
      />
    </label>
  )
}

function Section({ icon, title, hint, children }: { icon: ReactNode; title: string; hint: string; children: ReactNode }) {
  return (
    <div className={`p-6 sm:p-8 ${ui.card}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-olive-800">{icon}</span>
        <div>
          <h2 className="font-display text-xl font-medium text-ink">{title}</h2>
          <p className="text-xs text-forest-700/75">{hint}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  )
}

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
    void setAppLanguage(language)
    try {
      setSettings(await updateSettings({ language }))
    } catch {
      // The interface language still changes in this browser.
    }
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    setError(null)
    try {
      const { remindersEnabled, reminderTime, dayBeforeAlert, emailDigest } = settings
      setSettings(await updateSettings({ remindersEnabled, reminderTime, dayBeforeAlert, emailDigest }))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch {
      setError(t('settings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const set = (changes: Partial<UserSettings>) => setSettings((s) => (s ? { ...s, ...changes } : s))

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader kicker={t('settings.kicker')} title={t('settings.title')} titleEm={t('settings.titleEm')} lead={user?.email} />

      {error && (
        <div role="alert" className={`mt-6 ${ui.error}`}>
          {error}
        </div>
      )}

      <div className="mt-8 space-y-5">
        <Section icon={<Languages size={19} aria-hidden="true" />} title={t('settings.languageTitle')} hint={t('settings.languageHint')}>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('settings.languageTitle')}>
            {(['uk', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                aria-pressed={currentLang === lang}
                onClick={() => void chooseLanguage(lang)}
                className={currentLang === lang ? ui.btnPrimary : ui.btnSecondary}
              >
                {currentLang === lang && <Check size={15} aria-hidden="true" />}
                {lang === 'uk' ? 'Українська' : 'English'}
              </button>
            ))}
          </div>
        </Section>

        <form onSubmit={(e) => void handleSave(e)}>
          <Section icon={<Bell size={19} aria-hidden="true" />} title={t('settings.remindersTitle')} hint={t('settings.remindersHint')}>
            {!settings ? (
              !error && <p className={ui.muted}>{t('settings.loading')}</p>
            ) : (
              <div className="space-y-3">
                <Toggle
                  id="reminders-enabled"
                  checked={settings.remindersEnabled}
                  onChange={(v) => set({ remindersEnabled: v })}
                  title={t('settings.daily')}
                  hint={t('settings.dailyHint')}
                />
                <div
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-beige bg-ivory/40 px-4 py-3.5 ${
                    settings.remindersEnabled ? '' : 'opacity-50'
                  }`}
                >
                  <span>
                    <label htmlFor="reminder-time" className="block text-sm font-medium text-ink">
                      {t('settings.time')}
                    </label>
                    <span className="block text-xs text-forest-700/75">{t('settings.timeHint')}</span>
                  </span>
                  <input
                    id="reminder-time"
                    type="time"
                    disabled={!settings.remindersEnabled}
                    value={settings.reminderTime}
                    onChange={(e) => set({ reminderTime: e.target.value })}
                    className="rounded-xl border border-beige-dark bg-white px-3 py-1.5 text-sm text-forest-900"
                  />
                </div>
                <Toggle
                  id="day-before"
                  checked={settings.dayBeforeAlert}
                  disabled={!settings.remindersEnabled}
                  onChange={(v) => set({ dayBeforeAlert: v })}
                  title={t('settings.dayBefore')}
                  hint={t('settings.dayBeforeHint')}
                />
                <Toggle
                  id="email-digest"
                  checked={settings.emailDigest}
                  disabled={!settings.remindersEnabled}
                  onChange={(v) => set({ emailDigest: v })}
                  title={t('settings.email')}
                  hint={t('settings.emailHint')}
                />
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {saved && (
                    <span role="status" className="inline-flex items-center gap-1 text-xs font-medium text-olive-800">
                      <Mail size={14} aria-hidden="true" /> {t('settings.saved')}
                    </span>
                  )}
                  <button type="submit" disabled={saving} className={ui.btnPrimary}>
                    {saving ? t('care.saving') : t('settings.save')}
                  </button>
                </div>
              </div>
            )}
          </Section>
        </form>
      </div>
    </section>
  )
}
