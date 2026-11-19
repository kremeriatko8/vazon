import { Leaf, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FeedbackWidget } from '../components/FeedbackWidget'
import { useAuth } from '../hooks/useAuth'
import { setAppLanguage } from '../i18n'

/** App pages layout, from ProductLayout in the "Extend Design Across Pages" design. */
export function MainLayout() {
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const currentLang = i18n.language === 'uk' ? 'uk' : 'en'
  const close = () => setMenuOpen(false)

  const navigation = isAuthenticated
    ? [
        { to: '/dashboard', label: t('nav.today') },
        { to: '/plants', label: t('nav.myPlants') },
        { to: '/tasks', label: t('nav.tasks') },
        { to: '/settings', label: t('nav.settings') },
      ]
    : [
        { to: '/login', label: t('nav.logIn') },
        { to: '/register', label: t('nav.getStarted') },
      ]

  function handleLogout() {
    logout()
    close()
    navigate('/login', { replace: true })
  }

  return (
    <div className="product-app">
      <header className="product-header">
        <div className="product-shell product-nav">
          <NavLink className="app-brand" to="/" aria-label="Vazon home">
            <span>
              <Leaf size={18} aria-hidden="true" />
            </span>
            Vazon
          </NavLink>
          <nav className={`product-links ${menuOpen ? 'open' : ''}`} aria-label={t('nav.main')}>
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={close}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="account-actions">
            <div className="language-switch" role="group" aria-label={t('nav.language')}>
              {(['en', 'uk'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={currentLang === lang ? 'active' : ''}
                  aria-pressed={currentLang === lang}
                  onClick={() => setAppLanguage(lang)}
                >
                  {lang === 'uk' ? 'UA' : 'EN'}
                </button>
              ))}
            </div>
            {isAuthenticated && (
              <>
                <span className="account-email">{user?.email}</span>
                <button type="button" className="sign-out" onClick={handleLogout}>
                  {t('nav.logOut')}
                </button>
              </>
            )}
            <button
              type="button"
              className="product-menu"
              aria-label={t('nav.toggleMenu')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <Outlet />
      <FeedbackWidget />
      <span className="route-announcer" aria-live="polite">
        {location.pathname}
      </span>
    </div>
  )
}
