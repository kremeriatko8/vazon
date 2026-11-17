import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-medium text-forest-600">404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-forest-800">This page has wilted</h1>
      <p className="mt-3 text-forest-700/80">We could not find the page you were looking for.</p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-ivory hover:bg-forest-800"
      >
        Back to home
      </Link>
    </section>
  )
}
