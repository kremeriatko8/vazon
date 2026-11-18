import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { setAppLanguage } from '../i18n'

interface ReminderSettings {
  remindersEnabled: boolean
  reminderTime: string
  dayBeforeAlert: boolean
  emailDigest: boolean
}

const SETTINGS_KEY = 'vazon_settings'

function loadSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw) as ReminderSettings
  } catch {
    // ignore malformed storage
  }
  return {
    remindersEnabled: true,
    reminderTime: '09:00',
    dayBeforeAlert: false,
    emailDigest: true,
  }
}

export function SettingsPage() {
  const { i18n } = useTranslation()
  const isUk = i18n.language === 'uk'
  const { user } = useAuth()

  const [settings, setSettings] = useState<ReminderSettings>(() => loadSettings())
  const [savedNotice, setSavedNotice] = useState(false)

  function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2500)
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">
        {isUk ? 'Профіль та сповіщення' : 'Account & preferences'}
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-forest-800">
        {isUk ? 'Налаштування' : 'Settings'}
      </h1>

      <form onSubmit={handleSave} className="mt-6 space-y-6 rounded-3xl border border-beige bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="font-display text-lg font-semibold text-forest-800">
            {isUk ? 'Мова інтерфейсу' : 'Interface language'}
          </h2>
          <p className="mt-0.5 text-xs text-forest-700/75">
            {isUk ? 'Оберіть мову відображення Vazon.' : 'Choose your preferred language for Vazon.'}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setAppLanguage('uk')}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                isUk ? 'bg-forest-700 text-ivory' : 'border border-beige-dark bg-ivory/50 text-forest-800'
              }`}
            >
              Українська (UA)
            </button>
            <button
              type="button"
              onClick={() => setAppLanguage('en')}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                !isUk ? 'bg-forest-700 text-ivory' : 'border border-beige-dark bg-ivory/50 text-forest-800'
              }`}
            >
              English (EN)
            </button>
          </div>
        </div>

        <div className="border-t border-beige/70 pt-6">
          <h2 className="font-display text-lg font-semibold text-forest-800">
            {isUk ? 'Нагадування про полив та догляд' : 'Watering & care reminders'}
          </h2>
          <p className="mt-0.5 text-xs text-forest-700/75">
            {isUk
              ? `Налаштування сповіщень для ${user?.email ?? 'вашого акаунту'}.`
              : `Notification preferences for ${user?.email ?? 'your account'}.`}
          </p>

          <div className="mt-4 space-y-3.5">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-beige/80 bg-ivory/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-forest-900">
                  {isUk ? 'Щоденні нагадування' : 'Daily care reminders'}
                </p>
                <p className="text-xs text-forest-700/75">
                  {isUk ? 'Отримувати зведення рослин, які потребують поливу сьогодні' : 'Receive a daily digest of plants due for watering'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.remindersEnabled}
                onChange={(e) => setSettings((s) => ({ ...s, remindersEnabled: e.target.checked }))}
                className="h-4 w-4 rounded border-beige-dark text-forest-700 focus:ring-forest-600"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-beige/80 bg-ivory/40 px-4 py-3">
              <div>
                <label htmlFor="reminder-time" className="text-sm font-medium text-forest-900">
                  {isUk ? 'Час нагадування (Europe/Kyiv)' : 'Reminder time (Europe/Kyiv)'}
                </label>
                <p className="text-xs text-forest-700/75">
                  {isUk ? 'Коли найкраще нагадати про перевірку ґрунту' : 'Preferred time of day to check your plants'}
                </p>
              </div>
              <input
                id="reminder-time"
                type="time"
                disabled={!settings.remindersEnabled}
                value={settings.reminderTime}
                onChange={(e) => setSettings((s) => ({ ...s, reminderTime: e.target.value }))}
                className="rounded-xl border border-beige-dark bg-white px-3 py-1.5 text-sm text-forest-900 disabled:opacity-50"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-beige/80 bg-ivory/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-forest-900">
                  {isUk ? 'Попереджати за 1 день' : 'Notify 1 day in advance'}
                </p>
                <p className="text-xs text-forest-700/75">
                  {isUk ? 'Завчасне нагадування перед плановим поливом або підживленням' : 'Early heads-up before scheduled watering or feeding'}
                </p>
              </div>
              <input
                type="checkbox"
                disabled={!settings.remindersEnabled}
                checked={settings.dayBeforeAlert}
                onChange={(e) => setSettings((s) => ({ ...s, dayBeforeAlert: e.target.checked }))}
                className="h-4 w-4 rounded border-beige-dark text-forest-700 focus:ring-forest-600 disabled:opacity-50"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-beige/80 bg-ivory/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-forest-900">
                  {isUk ? 'Email-сповіщення' : 'Email notifications'}
                </p>
                <p className="text-xs text-forest-700/75">
                  {isUk ? 'Надсилати нагадування на електронну пошту' : 'Send care reminders to your inbox'}
                </p>
              </div>
              <input
                type="checkbox"
                disabled={!settings.remindersEnabled}
                checked={settings.emailDigest}
                onChange={(e) => setSettings((s) => ({ ...s, emailDigest: e.target.checked }))}
                className="h-4 w-4 rounded border-beige-dark text-forest-700 focus:ring-forest-600 disabled:opacity-50"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {savedNotice ? (
            <span className="text-xs font-medium text-forest-700">
              {isUk ? '✓ Налаштування збережено' : '✓ Settings saved'}
            </span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="rounded-full bg-forest-700 px-6 py-2.5 text-sm font-medium text-ivory transition hover:bg-forest-800"
          >
            {isUk ? 'Зберегти налаштування' : 'Save settings'}
          </button>
        </div>
      </form>
    </section>
  )
}
