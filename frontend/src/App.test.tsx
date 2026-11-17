import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

const placeholderRoutes = ['/login', '/register', '/dashboard', '/plants', '/plants/new', '/tasks']

describe('App routing', () => {
  it('renders landing page on /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /Vazon/i, level: 1 })).toBeInTheDocument()
  })

  it.each(placeholderRoutes)('renders placeholder route %s without errors', (route) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getAllByText(/Coming soon/i).length).toBeGreaterThan(0)
  })
})
