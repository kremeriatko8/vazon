import { ArrowRight, Bell, Check, Droplets, Leaf, Sprout, Stethoscope, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formatCareDate } from '../components/careActionMessages'
import { useAuth } from '../hooks/useAuth'
import { getCareTasks, type CareTask } from '../services/scheduleService'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=85'

/** The next watering of a signed-in user, for the hero card. Null while loading or for guests. */
function useNextWatering(enabled: boolean): CareTask | null {
  const [task, setTask] = useState<CareTask | null>(null)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getCareTasks()
      .then((tasks) => {
        if (!cancelled) setTask(tasks.find((t) => t.action === 'WATERED') ?? null)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [enabled])
  return enabled ? task : null
}

export function LandingPage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const nextWatering = useNextWatering(isAuthenticated)

  const primary = isAuthenticated
    ? { to: '/dashboard', label: t('landing.ctaToday') }
    : { to: '/register', label: t('landing.ctaStart') }

  const features = [
    { icon: Sun, title: t('landing.feature1Title'), text: t('landing.feature1Text') },
    { icon: Bell, title: t('landing.feature2Title'), text: t('landing.feature2Text') },
    { icon: Stethoscope, title: t('landing.feature3Title'), text: t('landing.feature3Text') },
  ]

  const demoTasks = [
    { icon: Droplets, title: t('landing.demoTask1'), meta: t('landing.demoTask1Meta') },
    { icon: Sun, title: t('landing.demoTask2'), meta: t('landing.demoTask2Meta') },
    { icon: Sprout, title: t('landing.demoTask3'), meta: t('landing.demoTask3Meta') },
  ]

  return (
    <>
      <section className="hero-gradient relative overflow-hidden text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-white/75 uppercase">
              <span className="h-px w-8 bg-white/50" /> {t('landing.eyebrow')}
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-medium sm:text-6xl">
              {t('landing.titleStart')} <em className="text-sage-200">{t('landing.titleEm')}</em>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">{t('landing.lead')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={primary.to}
                className="inline-flex items-center gap-2 rounded-full bg-ivory px-6 py-3 text-sm font-semibold text-olive-800 transition hover:bg-white"
              >
                {primary.label} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href="#how" className="text-sm font-medium text-white/85 underline-offset-4 hover:underline">
                {t('landing.seeHow')} ↘
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/70">
              <li>✓ {t('landing.fact1')}</li>
              <li>✓ {t('landing.fact2')}</li>
              <li>✓ {t('landing.fact3')}</li>
            </ul>
          </div>

          <div className="relative mx-auto h-[380px] w-full max-w-[440px] sm:h-[460px]" aria-hidden="true">
            <div className="absolute top-6 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#c9d36a]/25 blur-3xl" />
            <span className="animate-particle absolute top-[60%] left-[18%] h-1.5 w-1.5 rounded-full bg-white/70" />
            <span className="animate-particle absolute top-[70%] left-[78%] h-1 w-1 rounded-full bg-white/60 [animation-delay:2s]" />
            <span className="animate-particle absolute top-[55%] left-[62%] h-1.5 w-1.5 rounded-full bg-white/50 [animation-delay:4s]" />
            <div className="animate-plant-float absolute inset-x-10 top-4 bottom-16 overflow-hidden rounded-[999px_999px_40px_40px] border border-white/15 shadow-2xl">
              <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="animate-shadow-pulse absolute bottom-6 left-1/2 h-6 w-56 -translate-x-1/2 rounded-full bg-black/40 blur-md" />
            <div className="absolute top-16 -left-2 flex items-center gap-3 rounded-2xl border border-white/20 bg-olive-900/70 px-4 py-3 shadow-lg backdrop-blur-md sm:-left-6">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-200 text-olive-800">
                <Check size={15} />
              </span>
              <div className="text-left">
                <p className="text-[11px] text-white/70">{t('landing.cardHealth')}</p>
                <p className="text-sm font-semibold">{t('landing.cardHealthValue')}</p>
              </div>
            </div>
            <div className="absolute right-0 bottom-20 flex items-center gap-3 rounded-2xl border border-white/20 bg-olive-900/70 px-4 py-3 shadow-lg backdrop-blur-md sm:-right-4">
              <Droplets size={17} />
              <div className="text-left">
                <p className="text-[11px] text-white/70">{t('landing.cardNext')}</p>
                <p className="text-sm font-semibold">
                  {nextWatering
                    ? `${nextWatering.plantName} · ${formatCareDate(`${nextWatering.dueDate}T12:00:00Z`)}`
                    : t('landing.cardNextValue')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:py-28">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-olive-800 uppercase">
          <Leaf size={15} aria-hidden="true" /> {t('landing.introKicker')}
        </p>
        <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:items-end">
          <h2 className="font-display text-3xl leading-tight font-medium text-ink sm:text-5xl">
            {t('landing.introTitle')} <em className="text-olive-600">{t('landing.introTitleEm')}</em>
          </h2>
          <p className="text-base leading-relaxed text-forest-700/80">{t('landing.introText')}</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="rounded-3xl border border-beige bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint text-olive-800">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="font-display text-sm text-forest-700/50">0{index + 1}</span>
              </div>
              <h3 className="mt-5 font-display text-xl font-medium text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-forest-700/80">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-forest-800 py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-sage-300 uppercase">{t('landing.todayKicker')}</p>
            <h2 className="mt-4 font-display text-3xl leading-tight font-medium sm:text-5xl">
              {t('landing.todayTitle')} <em className="text-sage-200">{t('landing.todayTitleEm')}</em>
            </h2>
            <p className="mt-5 max-w-md text-white/75">{t('landing.todayText')}</p>
            <Link
              to={primary.to}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-ivory px-6 py-3 text-sm font-semibold text-forest-800 transition hover:bg-white"
            >
              {primary.label} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="rounded-3xl bg-ivory p-6 text-ink shadow-xl sm:p-8" aria-label={t('landing.demoLabel')}>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-forest-700/60 uppercase">{t('landing.demoLabel')}</p>
            <h3 className="mt-1 font-display text-2xl font-medium">{t('landing.demoTitle')}</h3>
            <ul className="mt-5 space-y-2.5">
              {demoTasks.map(({ icon: Icon, title, meta }) => (
                <li key={title} className="flex items-center gap-3 rounded-2xl border border-beige bg-white px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-olive-800">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="block text-xs text-forest-700/70">{meta}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
