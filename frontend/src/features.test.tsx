import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { setupApiMock } from './testApiMock'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  setupApiMock()
})

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

const signInStorage = () => {
  localStorage.setItem('vazon_access_token', 'jwt-token')
  localStorage.setItem('vazon_user', JSON.stringify({ id: 'u1', email: 'solomiia@example.com' }))
}

describe('OAuth callback, settings, feedback widget, and species presets', () => {
  it('completes Google OAuth callback with token and redirects to /plants', async () => {
    renderAt('/auth/callback?accessToken=google-jwt-123&email=oauth@example.com&id=u42')

    expect(await screen.findByRole('heading', { name: /My plants/i })).toBeInTheDocument()
    expect(localStorage.getItem('vazon_access_token')).toBe('google-jwt-123')
    expect(JSON.parse(localStorage.getItem('vazon_user') || '{}')).toEqual({
      id: 'u42',
      email: 'oauth@example.com',
    })
  })

  it('shows error state on /auth/callback when OAuth fails or token is missing', async () => {
    renderAt('/auth/callback?error=access_denied')
    expect(await screen.findByRole('alert')).toHaveTextContent("Sign-in was cancelled on the Google page.")
    expect(screen.getByRole('link', { name: /Back to log in/i })).toBeInTheDocument()
  })

  it('switches language and saves reminder settings through /me/settings', async () => {
    signInStorage()
    const state = setupApiMock()
    renderAt('/settings')

    expect(await screen.findByRole('heading', { name: /Your settings/i })).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('switch', { name: /One day in advance/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(state.settings.dayBeforeAlert).toBe(true))

    fireEvent.click(screen.getByRole('button', { name: 'Українська' }))
    expect(await screen.findByRole('heading', { name: /Ваші налаштування/i })).toBeInTheDocument()
    expect(localStorage.getItem('vazon_lang')).toBe('uk')
    await waitFor(() => expect(state.settings.language).toBe('uk'))

    // Switch back to English so following tests start in EN
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(await screen.findByRole('heading', { name: /Your settings/i })).toBeInTheDocument()
  })

  it('greets the user by the name from settings, and saves a new name', async () => {
    signInStorage()
    const state = setupApiMock()
    state.settings.displayName = 'Sofiia'
    renderAt('/dashboard')
    expect(await screen.findByRole('heading', { level: 1, name: /Sofiia/ })).toBeInTheDocument()

    cleanup()
    renderAt('/settings')
    const field = await screen.findByLabelText('Name')
    await waitFor(() => expect(field).toHaveValue('Sofiia'))
    fireEvent.change(field, { target: { value: 'Sonia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(state.settings.displayName).toBe('Sonia'))
    // The header shows the new name right away, without reloading.
    await waitFor(() => expect(document.querySelector('.account-email')).toHaveTextContent('Sonia'))
  })

  it('signed in, the landing menu shows the app pages and the app logo leads to Today', async () => {
    signInStorage()
    setupApiMock()
    renderAt('/')
    expect(await screen.findByRole('link', { name: 'My plants' })).toHaveAttribute('href', '/plants')
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument()

    cleanup()
    renderAt('/plants')
    expect(await screen.findByRole('link', { name: 'Vazon home' })).toHaveAttribute('href', '/dashboard')
  })

  it('opens FeedbackWidget and sends feedback to the API', async () => {
    const apiFetch = globalThis.fetch
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/feedback') && init?.method === 'POST') {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 'fb-1', createdAt: new Date().toISOString() }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }
      return apiFetch(input, init)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderAt('/')

    fireEvent.click(screen.getByRole('button', { name: /Leave feedback/i }))
    expect(screen.getByRole('dialog', { name: /Leave feedback/i })).toBeInTheDocument()

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Love the watering reminders!' } })
    fireEvent.submit(textarea.closest('form')!)

    await waitFor(() =>
      expect(screen.getByText(/Thank you! Your feedback has been recorded/i)).toBeInTheDocument(),
    )
    const feedbackCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith('/feedback'))
    const body = JSON.parse(String(feedbackCall?.[1]?.body)) as { message: string }
    expect(body.message).toBe('Rating: 5/5\nLove the watering reminders!')
  })

  it('adds a plant from the catalog with its suggested light on /plants/new', async () => {
    signInStorage()
    const state = setupApiMock()
    renderAt('/plants/new')

    fireEvent.change(await screen.findByLabelText(/Plant species or nickname/i), { target: { value: 'zami' } })
    fireEvent.click(await screen.findByRole('button', { name: /ZZ Plant/i }))
    fireEvent.click(screen.getByRole('button', { name: /Create care plan/i }))

    await waitFor(() =>
      expect(state.lastCreate).toMatchObject({
        name: 'ZZ Plant',
        species: 'Zamioculcas zamiifolia',
        speciesId: 'sp-zz',
        lightCondition: 'LOW',
      }),
    )
  })
})
