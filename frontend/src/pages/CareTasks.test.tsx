import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { setupApiMock } from '../testApiMock'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('vazon_access_token', 'jwt-token')
  localStorage.setItem('vazon_user', JSON.stringify({ id: 'u1', email: 'solomiia@example.com' }))
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  setupApiMock({
    plants: [
      {
        id: 'p-overdue',
        ownerId: 'u1',
        name: 'Calathea Orbifolia',
        species: 'Goeppertia orbifolia',
        lightCondition: 'MEDIUM',
        potSize: 'MEDIUM',
        radiatorDistance: 'NONE',
        location: 'Bathroom',
        wateringIntervalDays: 5,
        createdAt: tenDaysAgo,
        updatedAt: tenDaysAgo,
      },
    ],
  })
})

describe('Dashboard and care schedule tasks', () => {
  it('displays summary stats on dashboard and completes overdue tasks on tasks page', async () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: /Welcome back, solomiia/i })).toBeInTheDocument()
    expect(screen.getByText('Total plants')).toBeInTheDocument()

    cleanup()
    render(<MemoryRouter initialEntries={['/tasks']}><App /></MemoryRouter>)

    expect(await screen.findByRole('button', { name: 'Due now (1)' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Due now (0)' })).toBeInTheDocument()
    })
  })
})
