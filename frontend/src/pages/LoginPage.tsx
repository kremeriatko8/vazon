import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError(null)
    if (!email.trim() || !password) {
      setServerError('Please enter both email and password.')
      return
    }
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-3xl border border-beige bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-forest-800">Log in</h1>
        <p className="mt-2 text-sm text-forest-700/80">Sign in to check your plants and today&apos;s care tasks.</p>

        {serverError && (
          <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-forest-800">Email</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-forest-800">Password</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-forest-700 px-5 py-3 text-sm font-medium text-ivory transition hover:bg-forest-800 disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-forest-700/80">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-forest-700 underline hover:text-forest-900">Create one</Link>
        </p>
      </div>
    </section>
  )
}
