import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LandingPage() {
  const { i18n } = useTranslation()
  const isUk = i18n.language === 'uk'
  const { isAuthenticated } = useAuth()

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <div className="max-w-2xl">
        <span className="inline-block rounded-full bg-sage-100 px-3.5 py-1 text-xs font-medium tracking-wide text-forest-700 uppercase">
          {isUk ? 'Розумний догляд за рослинами' : 'Thoughtful plant care'}
        </span>
        <h1 className="page-title mt-5 font-display text-4xl leading-tight font-bold tracking-tight text-forest-800 sm:text-6xl">
          Vazon
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-forest-700/80 sm:text-xl">
          {isUk
            ? 'Персональні нагадування про полив і догляд за кожною кімнатною рослиною — з урахуванням виду, розміру горщика, освітлення та близькості до батареї.'
            : 'Personal watering and care reminders for every houseplant in your home — shaped by species, pot size, light, and proximity to radiators.'}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/plants"
                className="rounded-full bg-forest-700 px-6 py-3 text-sm font-medium text-ivory motion-safe:transition-colors hover:bg-forest-800"
              >
                {isUk ? 'До моїх рослин' : 'Go to my plants'}
              </Link>
              <Link
                to="/dashboard"
                className="rounded-full border border-forest-700/25 bg-white px-6 py-3 text-sm font-medium text-forest-800 motion-safe:transition-colors hover:border-forest-700/50"
              >
                {isUk ? 'Огляд на сьогодні' : "Today's overview"}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-full bg-forest-700 px-6 py-3 text-sm font-medium text-ivory motion-safe:transition-colors hover:bg-forest-800"
              >
                {isUk ? 'Створити акаунт' : 'Create an account'}
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-forest-700/25 bg-white px-6 py-3 text-sm font-medium text-forest-800 motion-safe:transition-colors hover:border-forest-700/50"
              >
                {isUk ? 'Увійти' : 'Log in'}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-3">
        <div className="rounded-3xl border border-beige bg-paper p-6 card-reveal shadow-botanical">
          <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">
            {isUk ? 'Персональний графік' : 'Tailored intervals'}
          </p>
          <h2 className="mt-2 font-display text-xl font-bold text-forest-800">
            {isUk ? 'Світло, горщик і мікроклімат' : 'Light, pot & radiator aware'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-forest-700/80">
            {isUk
              ? 'Графік поливу враховує освітленість кімнати, об’єм ґрунту та відстань до опалювальних приладів.'
              : 'Watering schedules adapt to room brightness, soil volume, and nearby heat sources.'}
          </p>
        </div>

        <div className="rounded-3xl border border-beige bg-paper p-6 card-reveal shadow-botanical">
          <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">
            {isUk ? 'Гнучкість' : 'Soil check'}
          </p>
          <h2 className="mt-2 font-display text-xl font-bold text-forest-800">
            {isUk ? '«Ґрунт ще вологий»' : '“Soil still wet” snooze'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-forest-700/80">
            {isUk
              ? 'Відкладіть полив одним натисканням, якщо земля ще не просохла, без втрати історії догляду.'
              : 'Postpone watering in one tap when topsoil is still damp while keeping a clean care log.'}
          </p>
        </div>

        <div className="rounded-3xl border border-beige bg-paper p-6 card-reveal shadow-botanical">
          <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">
            {isUk ? 'Історія догляду' : 'Care journal'}
          </p>
          <h2 className="mt-2 font-display text-xl font-bold text-forest-800">
            {isUk ? 'Полив, підживлення, пересадка' : 'Water, feed & repot history'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-forest-700/80">
            {isUk
              ? 'Кожна рослина має власну картку з нотатками, фото та хронологією виконаних дій.'
              : 'Every plant keeps its own timeline of waterings, feeding, repotting, and personal notes.'}
          </p>
        </div>
      </div>
    </section>
  )
}
