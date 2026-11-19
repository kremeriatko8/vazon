import { useTranslation } from 'react-i18next'
import { API_BASE_URL } from '../services/apiClient'

export function PrivacyFooter() {
  const { t } = useTranslation()

  return (
    <footer className="w-full px-6 py-5 text-center text-sm text-forest-700/80">
      <a
        href={`${API_BASE_URL}/privacy`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-forest-900"
      >
        {t('footer.privacy')}
      </a>
    </footer>
  )
}
