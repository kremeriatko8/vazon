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
    expect(await screen.findByRole('alert')).toHaveTextContent(/Google sign-in failed: access_denied/i)
    expect(screen.getByRole('link', { name: /Back to log in/i })).toBeInTheDocument()
  })

  it('switches language to Ukrainian and persists settings in /settings', async () => {
    signInStorage()
    renderAt('/settings')

    expect(await screen.findByRole('heading', { name: /Settings/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Українська \(UA\)/i }))
    expect(await screen.findByRole('heading', { name: /Налаштування/i })).toBeInTheDocument()
    expect(localStorage.getItem('vazon_lang')).toBe('uk')

    // Switch back to English so following tests start in EN
    fireEvent.click(screen.getByRole('button', { name: /English \(EN\)/i }))
    expect(await screen.findByRole('heading', { name: /Settings/i })).toBeInTheDocument()
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

  it('autofills species and light condition when selecting a species preset on /plants/new', async () => {
    signInStorage()
    renderAt('/plants/new')

    const presetBtn = await screen.findByRole('button', { name: /Monstera/i })
    fireEvent.click(presetBtn)

    const speciesInput = screen.getByLabelText(/Species/i) as HTMLInputElement
    expect(speciesInput.value).toBe('Monstera deliciosa')
    const lightSelect = screen.getByLabelText(/Light condition/i) as HTMLSelectElement
    expect(lightSelect.value).toBe('BRIGHT_INDIRECT')
  })
})
