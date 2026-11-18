import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FeedbackWidget } from '../components/FeedbackWidget'
import { Logo } from '../components/Logo'
import { useAuth } from '../hooks/useAuth'
import { setAppLanguage } from '../i18n'

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded-full px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-sage-100 text-forest-800' : 'text-forest-700 hover:bg-sage-100/70'
  }`
}

export function MainLayout() {
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const closeMenu = () => setMenuOpen(false)

  const currentLang = i18n.language === 'uk' ? 'uk' : 'en'

  const appLinks = [
    { to: '/dashboard', label: t('nav.today') },
    { to: '/plants', label: t('nav.myPlants') },
    { to: '/tasks', label: t('nav.tasks') },
    { to: '/settings', label: currentLang === 'uk' ? 'Налаштування' : 'Settings' },
  ]

  function handleLogout() {
    logout()
    closeMenu()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b border-beige/80 bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {appLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>{link.label}</NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <div className="mr-1 inline-flex rounded-full border border-beige-dark bg-white p-0.5 text-xs font-medium" role="group" aria-label="Language switcher">
              <button
                type="button"
                onClick={() => setAppLanguage('en')}
                className={`rounded-full px-2.5 py-1 transition ${currentLang === 'en' ? 'bg-forest-700 text-ivory' : 'text-forest-700 hover:text-forest-900'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setAppLanguage('uk')}
                className={`rounded-full px-2.5 py-1 transition ${currentLang === 'uk' ? 'bg-forest-700 text-ivory' : 'text-forest-700 hover:text-forest-900'}`}
              >
                UA
              </button>
            </div>

            {isAuthenticated ? (
              <>
                <span className="px-2 text-xs text-forest-700/80">{user?.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-forest-700/25 bg-white px-4 py-2 text-sm font-medium text-forest-800 transition hover:border-forest-700/50"
                >
                  {t('nav.logOut')}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>{t('nav.logIn')}</NavLink>
                <NavLink to="/register" className="rounded-full bg-forest-700 px-4 py-2 text-sm font-medium text-ivory transition hover:bg-forest-800">
                  {t('nav.getStarted')}
                </NavLink>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <div className="inline-flex rounded-full border border-beige-dark bg-white p-0.5 text-xs font-medium" role="group" aria-label="Mobile language switcher">
              <button
                type="button"
                onClick={() => setAppLanguage('en')}
                className={`rounded-full px-2 py-0.5 transition ${currentLang === 'en' ? 'bg-forest-700 text-ivory' : 'text-forest-700'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setAppLanguage('uk')}
                className={`rounded-full px-2 py-0.5 transition ${currentLang === 'uk' ? 'bg-forest-700 text-ivory' : 'text-forest-700'}`}
              >
                UA
              </button>
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-forest-800"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">{t('nav.toggleMenu')}</span>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-beige px-4 py-3 md:hidden" aria-label="Mobile">
            <div className="flex flex-col gap-1">
              {appLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navClass} onClick={closeMenu}>{link.label}</NavLink>
              ))}
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="mt-2 rounded-full border border-forest-700/25 bg-white px-4 py-2 text-left text-sm font-medium text-forest-800">
                  {t('nav.logOut')} ({user?.email})
                </button>
              ) : (
                <>
                  <NavLink to="/login" className={navClass} onClick={closeMenu}>{t('nav.logIn')}</NavLink>
                  <NavLink to="/register" className={navClass} onClick={closeMenu}>{t('nav.getStarted')}</NavLink>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <FeedbackWidget />
      <footer className="border-t border-beige bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-forest-700/70 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.tagline')}</p>
          <p>{t('footer.project')}</p>
        </div>
      </footer>
    </div>
  )
}
