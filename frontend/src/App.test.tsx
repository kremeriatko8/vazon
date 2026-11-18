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
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)

describe('App routing and auth', () => {
  it('renders guest CTAs on / when logged out and Go to my plants when logged in', async () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: /Vazon/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Create an account/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Go to my plants/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Sign-up is not available yet/i)).not.toBeInTheDocument()

    cleanup()
    localStorage.setItem('vazon_access_token', 'jwt-token')
    localStorage.setItem('vazon_user', JSON.stringify({ id: 'u1', email: 'solomiia@example.com' }))

    renderAt('/')
    expect(await screen.findByRole('link', { name: /Go to my plants/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Create an account/i })).not.toBeInTheDocument()
  })

  it('redirects authenticated users away from /login and /register to /plants', async () => {
    localStorage.setItem('vazon_access_token', 'jwt-token')
    localStorage.setItem('vazon_user', JSON.stringify({ id: 'u1', email: 'solomiia@example.com' }))

    renderAt('/login')
    expect(await screen.findByRole('heading', { name: /My plants/i })).toBeInTheDocument()

    cleanup()
    renderAt('/register')
    expect(await screen.findByRole('heading', { name: /My plants/i })).toBeInTheDocument()
  })

  it.each(['/dashboard', '/plants', '/plants/new', '/tasks'])('redirects %s to /login', (path) => {
    renderAt(path)
    expect(screen.getByRole('heading', { name: /Log in/i })).toBeInTheDocument()
  })

  it('registers, logs out, and handles login error', async () => {
    renderAt('/register')
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /My plants/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Log out/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /Log in/i })).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'bad@b.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Invalid email or password/i))
  })
})
