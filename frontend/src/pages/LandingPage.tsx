import { Link } from 'react-router-dom'
import { BackendStatus } from '../components/BackendStatus'
import { FeatureCard } from '../components/FeatureCard'
import { BellIcon, CalendarIcon, CheckIcon, DropletIcon, HistoryIcon, SproutIcon } from '../components/icons'
import { StatusBadge } from '../components/StatusBadge'

const features = [
  {
    icon: <SproutIcon />,
    title: 'Plant profiles',
    description: 'Add each plant with its species, light, pot size and how close it sits to a radiator.',
  },
  {
    icon: <CalendarIcon />,
    title: 'Personal care schedules',
    description: 'Watering, feeding and repotting dates worked out for each plant rather than a generic rule.',
  },
  {
    icon: <CheckIcon />,
    title: 'Today view',
    description: 'One list of what needs doing today. Mark a task done, or tell Vazon the soil is still wet.',
  },
  {
    icon: <DropletIcon />,
    title: 'Learns from feedback',
    description: '“Soil still wet” pushes the next watering back, so the schedule adapts to your flat.',
  },
  {
    icon: <HistoryIcon />,
    title: 'Care history',
    description: 'A simple log of what you did and when, for every plant.',
  },
  {
    icon: <BellIcon />,
    title: 'Reminders',
    description: 'A nudge when something is due, so plants are not forgotten during exam season.',
  },
]

const factors = ['Species', 'Season', 'Light', 'Pot size', 'Radiator distance', 'Your feedback']

const steps = [
  { title: 'Add your plants', text: 'Tell Vazon what you have and where it lives.' },
  { title: 'Get a schedule', text: 'Each plant gets its own watering, feeding and repotting plan.' },
  { title: 'Check “Today”', text: 'Do the tasks, mark them done, and the plan adjusts.' },
]

const previewTasks = [
  { plant: 'Monstera', task: 'Water', note: 'Bright indirect · large pot' },
  { plant: 'Pothos', task: 'Check soil', note: 'Near radiator' },
  { plant: 'Snake plant', task: 'Feed', note: 'Low light · monthly' },
]

export function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-sage-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-beige/80 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sage-300 bg-white/70 px-3 py-1 text-xs font-medium text-forest-700">
              <span className="h-1.5 w-1.5 rounded-full bg-sage-500" />
              Early prototype · Made in Lviv
            </p>
            <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-forest-800 sm:text-6xl">
              Vazon
            </h1>
            <p className="mt-3 text-2xl font-medium text-forest-600 sm:text-3xl">
              Houseplant care without the guesswork.
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-forest-700/85 sm:text-lg">
              Vazon gives every plant its own watering, feeding and repotting schedule. It takes into
              account the species, the season, the light in your room, the pot size and even the
              radiator next to the windowsill, then adjusts when you tell it the soil is still wet.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-forest-700 px-6 py-3 font-medium text-ivory shadow-sm transition hover:bg-forest-800"
              >
                Create an account
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-forest-700/20 bg-white px-6 py-3 font-medium text-forest-800 transition hover:border-forest-700/40"
              >
                See planned features
              </a>
            </div>
            <p className="mt-3 text-xs text-forest-700/60">
              Sign-up is not available yet. The account pages are placeholders.
            </p>
          </div>

          {/* Illustrative preview of the planned Today view */}
          <figure className="relative mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-beige bg-white p-6 shadow-xl shadow-forest-900/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">Today</p>
                  <p className="font-display text-xl font-semibold text-forest-800">3 plants need you</p>
                </div>
                <StatusBadge variant="planned" label="Design preview" />
              </div>
              <ul className="mt-5 space-y-3">
                {previewTasks.map((item) => (
                  <li
                    key={item.plant}
                    className="flex items-center justify-between rounded-2xl bg-ivory px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-200 text-forest-700">
                        <SproutIcon />
                      </span>
                      <div>
                        <p className="font-medium text-forest-800">{item.plant}</p>
                        <p className="text-xs text-forest-700/70">{item.note}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-forest-700 ring-1 ring-sage-300">
                      {item.task}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <figcaption className="mt-3 text-center text-xs text-forest-700/60">
              Illustration of the planned “Today” view, with sample data.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-beige bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-semibold text-forest-800">How it will work</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl bg-ivory p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-700 text-sm font-semibold text-ivory">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold text-forest-800">{step.title}</h3>
                <p className="mt-1 text-sm text-forest-700/80">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <p className="text-sm font-medium text-forest-700">Schedules will consider:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {factors.map((factor) => (
                <li
                  key={factor}
                  className="rounded-full border border-sage-300 bg-sage-100 px-3 py-1 text-sm text-forest-700"
                >
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold text-forest-800">Planned features</h2>
          <p className="mt-3 text-forest-700/80">
            Vazon is at the start of development. Everything below is planned, not built yet.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Project status */}
      <section className="bg-forest-800 text-ivory">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold">Where the project is now</h2>
            <p className="mt-3 text-ivory/80">
              The foundation is in place: a React frontend, a NestJS API, a PostgreSQL database and a
              Docker setup the whole team can run. Product features come next.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ivory/85">
              <li>✓ Frontend, API and database running together</li>
              <li>✓ Health check endpoint and API documentation</li>
              <li>✓ Initial database schema for users, plants, tasks and history</li>
              <li className="text-ivory/60">○ Accounts, plants, schedules and reminders: not started</li>
            </ul>
          </div>
          <div className="lg:pt-2">
            <p className="mb-3 text-sm font-medium text-ivory/80">Live connection check</p>
            <BackendStatus />
          </div>
        </div>
      </section>
    </>
  )
}
