import { ArrowRight, Sprout } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ui } from '../components/styles'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="animate-plant-float flex h-16 w-16 items-center justify-center rounded-3xl bg-mint text-olive-800">
        <Sprout size={30} aria-hidden="true" />
      </span>
      <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-olive-800 uppercase">404</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-ink">
        {t('notFound.title')} <em className="text-olive-600">{t('notFound.titleEm')}</em>
      </h1>
      <p className="mt-3 text-forest-700/80">{t('notFound.text')}</p>
      <Link to="/" className={`mt-8 ${ui.btnPrimary}`}>
        {t('notFound.home')} <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  )
}
