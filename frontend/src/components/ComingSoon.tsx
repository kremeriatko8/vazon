import { Link } from 'react-router-dom'
import { StatusBadge } from './StatusBadge'

interface ComingSoonProps {
  title: string
  description: string
  plannedItems: string[]
  owner: string
}

/**
 * Placeholder used by every route that is not built yet.
 * It makes it obvious to testers that the screen has no real functionality.
 */
export function ComingSoon({ title, description, plannedItems, owner }: ComingSoonProps) {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-20">
      <div className="rounded-3xl border border-dashed border-sage-400 bg-white/70 p-6 sm:p-10">
        <StatusBadge variant="soon" />
        <h1 className="mt-4 font-display text-3xl font-semibold text-forest-800 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-forest-700/80">{description}</p>

        <h2 className="mt-8 text-sm font-semibold tracking-wide text-forest-600 uppercase">
          Planned for this screen
        </h2>
        <ul className="mt-3 space-y-2">
          {plannedItems.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-forest-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-8 text-xs text-forest-700/60">
          This page is a placeholder. Nothing here is functional yet. Owner: {owner}.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-ivory transition hover:bg-forest-800"
        >
          ← Back to home
        </Link>
      </div>
    </section>
  )
}
