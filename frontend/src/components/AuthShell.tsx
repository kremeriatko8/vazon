import { Check, Droplets } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=85'

interface AuthShellProps {
  kicker: string
  title: string
  subtitle: string
  children: ReactNode
}

/** Sign-in and sign-up layout: the olive "floating plant" panel next to the form. */
export function AuthShell({ kicker, title, subtitle, children }: AuthShellProps) {
  const { t } = useTranslation()
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:py-14 lg:grid-cols-2 lg:items-stretch">
      <div className="hero-gradient relative hidden overflow-hidden rounded-[2rem] p-10 text-white lg:flex lg:flex-col lg:justify-between" aria-hidden="true">
        <p className="font-display text-3xl leading-tight font-medium">
          {t('landing.titleStart')} <em className="text-sage-200">{t('landing.titleEm')}</em>
        </p>
        <div className="relative mx-auto mt-8 h-80 w-64">
          <div className="animate-plant-float absolute inset-0 overflow-hidden rounded-[999px_999px_32px_32px] border border-white/15 shadow-2xl">
            <img src={AUTH_IMAGE} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute top-10 -left-14 flex items-center gap-2.5 rounded-2xl border border-white/20 bg-olive-900/70 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-200 text-olive-800">
              <Check size={13} />
            </span>
            <span className="text-xs font-semibold">{t('landing.cardHealthValue')}</span>
          </div>
          <div className="absolute -right-12 bottom-8 flex items-center gap-2.5 rounded-2xl border border-white/20 bg-olive-900/70 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
            <Droplets size={15} />
            <span className="text-xs font-semibold">{t('landing.cardNext')}</span>
          </div>
        </div>
        <p className="mt-8 text-sm text-white/75">{t('landing.lead')}</p>
      </div>

      <div className="mx-auto w-full max-w-md self-center rounded-[2rem] border border-beige bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold tracking-[0.18em] text-olive-800 uppercase">{kicker}</p>
        <h1 className="mt-2 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-forest-700/80">{subtitle}</p>
        {children}
      </div>
    </section>
  )
}
