import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError(null)
    if (!email.trim() || !email.includes('@')) {
      setServerError('Please enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setServerError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setServerError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await register({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-3xl border border-beige bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">Get started</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-forest-800">Create an account</h1>
        <p className="mt-2 text-sm text-forest-700/80">Set up your profile to build personal care schedules.</p>

        {serverError && (
          <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-forest-800">Email</label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-forest-800">Password</label>
            <input
              id="register-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="register-confirm" className="block text-sm font-medium text-forest-800">Confirm password</label>
            <input
              id="register-confirm"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-forest-700 px-5 py-3 text-sm font-medium text-ivory transition hover:bg-forest-800 disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-forest-700/80">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-forest-700 underline hover:text-forest-900">Log in</Link>
        </p>
      </div>
    </section>
  )
}
