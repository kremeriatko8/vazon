import {
  ArrowRight,
  Bell,
  Check,
  Droplets,
  Leaf,
  Menu,
  Plus,
  Search,
  Sparkles,
  Sprout,
  Sun,
  X,
} from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { formatCareDate } from '../components/careActionMessages'
import { FeedbackWidget } from '../components/FeedbackWidget'
import { useAuth } from '../hooks/useAuth'
import { setAppLanguage } from '../i18n'
import { API_BASE_URL } from '../services/apiClient'
import { getCareTasks, type CareTask } from '../services/scheduleService'

const MONSTERA = 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1200&q=90'
const DEMO_PLANTS = [
  {
    key: 'monstera',
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=700&q=85',
    attention: true,
  },
  {
    key: 'bird',
    image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=700&q=85',
    attention: false,
  },
  {
    key: 'mini',
    image: 'https://images.unsplash.com/photo-1625582598943-2445bb7b8253?auto=format&fit=crop&w=700&q=85',
    attention: false,
  },
] as const
const DEMO_TASKS = [
  { id: 1, key: 'task1', icon: Droplets },
  { id: 2, key: 'task2', icon: Sun },
  { id: 3, key: 'task3', icon: Sparkles },
] as const

/** Landing page, from the Vazon Plant Care design. The care and collection sections are an example. */
export function LandingPage() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [completed, setCompleted] = useState<number[]>([])
  const [plantIndex, setPlantIndex] = useState(0)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [nextWatering, setNextWatering] = useState<CareTask | null>(null)
  const isUk = i18n.language === 'uk'

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    getCareTasks()
      .then((tasks) => {
        if (!cancelled) setNextWatering(tasks.find((task) => task.action === 'WATERED') ?? null)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const start = () => navigate(isAuthenticated ? '/dashboard' : '/register')
  const addPlant = () => (isAuthenticated ? setModalOpen(true) : navigate('/register'))
  const continueAdding = (notSure = false) => {
    setModalOpen(false)
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (notSure) params.set('unknown', '1')
    navigate(`/plants/new${params.size ? `?${params.toString()}` : ''}`)
  }
  const toggleTask = (id: number) =>
    setCompleted((current) => (current.includes(id) ? current.filter((task) => task !== id) : [...current, id]))

  const now = new Date()
  const locale = isUk ? 'uk-UA' : 'en-GB'
  const datePart = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: 'Europe/Kyiv', ...options }).format(now).replace('.', '').toUpperCase()

  return (
    <main>
      <section className="hero" id="home">
        <nav className="nav shell" aria-label={t('nav.main')}>
          <Link to="/" className="brand" aria-label="Vazon home">
            <span className="brand-mark">
              <Leaf size={18} />
            </span>
            Vazon
          </Link>
          <div className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
            {isAuthenticated ? (
              // Signed in: the same pages as the app menu, not the landing sections.
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                  {t('nav.today')}
                </Link>
                <Link to="/plants" onClick={() => setMenuOpen(false)}>
                  {t('nav.myPlants')}
                </Link>
                <Link to="/tasks" onClick={() => setMenuOpen(false)}>
                  {t('nav.tasks')}
                </Link>
                <Link to="/settings" onClick={() => setMenuOpen(false)}>
                  {t('nav.settings')}
                </Link>
              </>
            ) : (
              <>
                <a href="#care" onClick={() => setMenuOpen(false)}>
                  {t('home.navCare')}
                </a>
                <a href="#collection" onClick={() => setMenuOpen(false)}>
                  {t('home.navGarden')}
                </a>
                <a href="#journal" onClick={() => setMenuOpen(false)}>
                  {t('home.navJournal')}
                </a>
                <a href="#guide" onClick={() => setMenuOpen(false)}>
                  {t('home.navGuide')}
                </a>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  {t('nav.logIn')}
                </Link>
              </>
            )}
            <button type="button" className="home-lang" onClick={() => setAppLanguage(isUk ? 'en' : 'uk')}>
              {isUk ? 'EN' : 'UA'}
            </button>
          </div>
          <div className="nav-actions">
            <button
              className="icon-button light"
              aria-label={t('home.search')}
              onClick={() => (isAuthenticated ? navigate('/plants') : setToast(t('home.searchToast')))}
            >
              <Search size={18} />
            </button>
            <button className="nav-cta" onClick={addPlant}>
              {t('home.addPlant')} <Plus size={16} />
            </button>
            <button className="menu-button" aria-label={t('nav.toggleMenu')} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        <div className="hero-grid shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> {t('landing.eyebrow')}
            </div>
            <h1>
              {t('landing.titleStart')} <em>{t('landing.titleEm')}</em>
            </h1>
            <p>{t('landing.lead')}</p>
            <div className="hero-buttons">
              <button className="primary-button" onClick={start}>
                {isAuthenticated ? t('landing.ctaToday') : t('home.grow')} <ArrowRight size={18} />
              </button>
              <a className="text-link" href="#care">
                {t('landing.seeHow')} <span>↘</span>
              </a>
            </div>
            <div className="social-proof">
              <div>
                <strong>{t('home.proofStrong')}</strong>
                <small>{t('home.proofSmall')}</small>
              </div>
            </div>
          </div>

          <div className="plant-stage" aria-label={t('home.stageLabel')}>
            <div className="sun-orb" />
            <div className="botanical-line line-one" />
            <div className="botanical-line line-two" />
            <span className="particle particle-one" />
            <span className="particle particle-two" />
            <span className="particle particle-three" />
            <div className="plant-float">
              <div className="plant-portrait">
                <img src={MONSTERA} alt={t('home.heroAlt')} />
              </div>
            </div>
            <div className="plant-shadow" />
            <div className="plant-status glass-card">
              <span className="status-icon">
                <Check size={15} />
              </span>
              <div>
                <small>{t('landing.cardHealth')}</small>
                <strong>{t('home.healthValue')}</strong>
              </div>
            </div>
            <div className="next-care glass-card">
              <Droplets size={17} />
              <div>
                <small>{t('landing.cardNext')}</small>
                <strong>
                  {nextWatering
                    ? `${nextWatering.plantName} · ${formatCareDate(`${nextWatering.dueDate}T12:00:00Z`)}`
                    : t('home.nextValue')}
                </strong>
              </div>
            </div>
            <div className="hero-caption">
              <span>01</span> Monstera deliciosa
            </div>
          </div>
        </div>
        <div className="hero-bottom shell">
          <span>{t('home.scroll')}</span>
          <div className="scroll-line" />
          <span className="hero-quote">{t('home.quote')}</span>
        </div>
      </section>

      <section className="intro section shell" id="guide">
        <div className="section-kicker">
          <Leaf size={15} /> {t('home.introKicker')}
        </div>
        <div className="intro-grid">
          <h2>
            {t('landing.introTitle')}
            <br />
            <em>{t('landing.introTitleEm')}</em>
          </h2>
          <div>
            <p>{t('landing.introText')}</p>
            <a href="#collection" className="inline-link">
              {t('home.discover')} <ArrowRight size={17} />
            </a>
          </div>
        </div>
        <div className="feature-row">
          {[
            { icon: Sun, title: t('landing.feature1Title'), text: t('landing.feature1Text') },
            { icon: Bell, title: t('landing.feature2Title'), text: t('landing.feature2Text') },
            { icon: Sprout, title: t('landing.feature3Title'), text: t('landing.feature3Text') },
          ].map(({ icon: Icon, title, text }, index) => (
            <article key={title}>
              <span className="feature-number">0{index + 1}</span>
              <div className="feature-icon">
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="care-section section" id="care">
        <div className="shell">
          <div className="care-header">
            <div>
              <div className="section-kicker pale">
                <span /> {t('landing.todayKicker')}
              </div>
              <h2>
                {t('home.careTitle')} <em>{t('home.careTitleEm')}</em>
              </h2>
            </div>
            <div className="date-badge">
              <span>{datePart({ weekday: 'short' })}</span>
              <strong>{datePart({ day: 'numeric' })}</strong>
              <small>{datePart({ month: 'long' })}</small>
            </div>
          </div>
          <div className="care-grid">
            <div className="task-panel">
              <div className="panel-top">
                <div>
                  <small>{t('home.rhythm')}</small>
                  <h3>{completed.length === 3 ? t('dashboard.allDone') : t('dashboard.reminders', { count: 3 - completed.length })}</h3>
                </div>
                <div className="progress-ring" style={{ '--progress': completed.length / 3 } as CSSProperties}>
                  <span>{completed.length}/3</span>
                </div>
              </div>
              <div className="tasks">
                {DEMO_TASKS.map(({ id, key, icon: Icon }) => {
                  const done = completed.includes(id)
                  return (
                    <button className={`task ${done ? 'done' : ''}`} key={id} onClick={() => toggleTask(id)} aria-pressed={done}>
                      <span className="task-icon">
                        <Icon size={20} />
                      </span>
                      <span className="task-copy">
                        <strong>{t(`home.${key}`)}</strong>
                        <small>{t(`home.${key}Meta`)}</small>
                      </span>
                      <span className="task-check">{done && <Check size={16} />}</span>
                    </button>
                  )
                })}
              </div>
              <button
                className="complete-button"
                onClick={() => {
                  setCompleted([1, 2, 3])
                  setToast(t('home.completeToast'))
                }}
              >
                {t('home.complete')} <ArrowRight size={17} />
              </button>
            </div>
            <div className="spotlight-card">
              <img src={DEMO_PLANTS[0].image} alt={t('home.spotlightAlt')} />
              <div className="spotlight-overlay">
                <span>{t('dashboard.spotlight')}</span>
                <div>
                  <h3>{t('home.spotlightTitle')}</h3>
                  <p>{t('home.spotlightText')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="collection section shell" id="collection">
        <div className="collection-heading">
          <div>
            <div className="section-kicker">
              <Leaf size={15} /> {t('dashboard.collectionKicker')}
            </div>
            <h2>
              {t('dashboard.collectionTitle')} <em>{t('dashboard.collectionTitleEm')}</em>
            </h2>
          </div>
          <div className="collection-controls">
            <span>{String(plantIndex + 1).padStart(2, '0')} / 03</span>
            <button aria-label={t('home.prev')} onClick={() => setPlantIndex((plantIndex + 2) % 3)}>
              ←
            </button>
            <button aria-label={t('home.next')} onClick={() => setPlantIndex((plantIndex + 1) % 3)}>
              →
            </button>
          </div>
        </div>
        <div className="plant-cards">
          {DEMO_PLANTS.map((plant, index) => (
            <article
              className={`plant-card ${plantIndex === index ? 'active' : ''}`}
              key={plant.key}
              onClick={() => setPlantIndex(index)}
            >
              <div className="plant-card-image">
                <img src={plant.image} alt={t(`home.plant.${plant.key}.name`)} />
                <span className={`health-dot ${plant.attention ? 'attention' : ''}`} />
                <button aria-label={t(`home.plant.${plant.key}.name`)} onClick={addPlant}>
                  <ArrowRight size={18} />
                </button>
              </div>
              <div className="plant-card-meta">
                <div>
                  <h3>{t(`home.plant.${plant.key}.name`)}</h3>
                  <p>{t(`home.plant.${plant.key}.room`)}</p>
                </div>
                <span>{t(`home.plant.${plant.key}.note`)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="journal section" id="journal">
        <div className="journal-inner shell">
          <div className="journal-art">
            <div className="journal-image">
              <img src={DEMO_PLANTS[1].image} alt={t('home.journalAlt')} />
            </div>
            <span className="journal-note">
              {t('home.journalNote1')}
              <br />
              {t('home.journalNote2')}
            </span>
          </div>
          <div className="journal-copy">
            <div className="section-kicker pale">
              <Sprout size={15} /> {t('home.journalKicker')}
            </div>
            <h2>
              {t('home.journalTitle')}
              <br />
              <em>{t('home.journalTitleEm')}</em>
            </h2>
            <p>{t('home.journalText')}</p>
            <button className="ivory-button" onClick={() => navigate(isAuthenticated ? '/plants' : '/register')}>
              {t('home.journalCta')} <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-top shell">
          <div>
            <Link to="/" className="brand dark">
              <span className="brand-mark">
                <Leaf size={18} />
              </span>
              Vazon
            </Link>
            <p>{t('home.footerLine')}</p>
          </div>
          <div className="footer-links">
            <a href="#care">{t('home.navCare')}</a>
            <a href="#collection">{t('home.navGarden')}</a>
            <a href="#journal">{t('home.navJournal')}</a>
            <a href="#guide">{t('home.navGuide')}</a>
          </div>
          <button className="primary-button" onClick={addPlant}>
            {t('home.addFirst')} <ArrowRight size={18} />
          </button>
        </div>
        <div className="footer-bottom shell">
          <span>© {now.getFullYear()} Vazon</span>
          <span>{t('footer.project')}</span>
          <a href={`${API_BASE_URL}/privacy`}>{t('footer.privacy')}</a>
        </div>
      </footer>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setModalOpen(false)} aria-label={t('care.tooEarly.cancel')}>
              <X size={20} />
            </button>
            <span className="modal-icon">
              <Sprout />
            </span>
            <div className="section-kicker">{t('addPlant.kicker')}</div>
            <h2 id="modal-title">
              {t('addPlant.whoTitle')}
              <br />
              <em>{t('addPlant.whoTitleEm')}</em>
            </h2>
            <p>{t('home.modalText')}</p>
            <label htmlFor="landing-plant-search">{t('addPlant.searchLabel')}</label>
            <div className="input-wrap">
              <Search size={18} />
              <input
                id="landing-plant-search"
                placeholder={t('addPlant.searchPlaceholder')}
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && continueAdding()}
              />
            </div>
            <button className="primary-button wide" onClick={() => continueAdding()}>
              {t('home.continue')} <ArrowRight size={18} />
            </button>
            <button className="identify-button" onClick={() => continueAdding(true)}>
              {t('addPlant.notSure')}
            </button>
          </div>
        </div>
      )}
      <FeedbackWidget />
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </main>
  )
}
