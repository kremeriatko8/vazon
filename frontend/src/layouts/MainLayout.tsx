import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from '../hooks/useAuth'

const appLinks = [
  { to: '/dashboard', label: 'Today' },
  { to: '/plants', label: 'My plants' },
  { to: '/tasks', label: 'Tasks' },
]

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded-full px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-sage-100 text-forest-800' : 'text-forest-700 hover:bg-sage-100/70'
  }`
}

export function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const closeMenu = () => setMenuOpen(false)

  function handleLogout() {
    logout()
    closeMenu()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-beige/80 bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {appLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>{link.label}</NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <span className="px-2 text-xs text-forest-700/80">{user?.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-forest-700/25 bg-white px-4 py-2 text-sm font-medium text-forest-800 transition hover:border-forest-700/50"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>Log in</NavLink>
                <NavLink to="/register" className="rounded-full bg-forest-700 px-4 py-2 text-sm font-medium text-ivory transition hover:bg-forest-800">
                  Get started
                </NavLink>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-forest-800 md:hidden"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">Toggle menu</span>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-beige px-4 py-3 md:hidden" aria-label="Mobile">
            <div className="flex flex-col gap-1">
              {appLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navClass} onClick={closeMenu}>{link.label}</NavLink>
              ))}
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="mt-2 rounded-full border border-forest-700/25 bg-white px-4 py-2 text-left text-sm font-medium text-forest-800">
                  Log out ({user?.email})
                </button>
              ) : (
                <>
                  <NavLink to="/login" className={navClass} onClick={closeMenu}>Log in</NavLink>
                  <NavLink to="/register" className={navClass} onClick={closeMenu}>Get started</NavLink>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-beige bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-forest-700/70 sm:flex-row sm:items-center sm:justify-between">
          <p>Vazon · Houseplant care without the guesswork.</p>
          <p>University team project · Lviv, Ukraine · Early prototype</p>
        </div>
      </footer>
    </div>
  )
}
