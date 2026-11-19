import { ArrowLeft, Leaf } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/** 404, from NotFoundPage in the "Extend Design Across Pages" design. */
export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <main className="not-found">
      <Leaf aria-hidden="true" />
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.text')}</p>
      <Link className="app-button" to="/dashboard">
        <ArrowLeft size={16} />
        {t('notFound.home')}
      </Link>
    </main>
  )
}
