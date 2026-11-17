import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)
beforeEach(() => localStorage.clear())

const renderAt = (path: string) =>
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)

describe('App routing and auth', () => {
  it('renders landing page on /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: /Vazon/i, level: 1 })).toBeInTheDocument()
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
    await waitFor(() => expect(screen.getByRole('heading', { name: /Today/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Log out/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /Log in/i })).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'bad@b.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Invalid email or password/i))
  })
})
