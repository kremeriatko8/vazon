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
  setupApiMock({
    plants: [
      {
        id: 'plant-1',
        ownerId: 'u1',
        name: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        lightCondition: 'BRIGHT_INDIRECT',
        potSize: 'LARGE',
        radiatorDistance: 'FAR',
        location: 'Living room',
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-01T10:00:00.000Z',
      },
      {
        id: 'plant-2',
        ownerId: 'u1',
        name: 'Snake Plant',
        species: 'Dracaena trifasciata',
        lightCondition: 'LOW',
        potSize: 'MEDIUM',
        radiatorDistance: 'NONE',
        location: 'Bedroom',
        createdAt: '2026-10-05T12:00:00.000Z',
        updatedAt: '2026-10-05T12:00:00.000Z',
      },
    ],
  })
})

describe('Plants flow', () => {
  it('lists plants, filters by search, adds and removes a plant', async () => {
    render(<MemoryRouter initialEntries={['/plants']}><App /></MemoryRouter>)

    expect(await screen.findByText('Monstera Deliciosa')).toBeInTheDocument()
    expect(screen.getByText('Snake Plant')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), { target: { value: 'Snake' } })
    expect(screen.queryByText('Monstera Deliciosa')).not.toBeInTheDocument()
    expect(screen.getByText('Snake Plant')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: /\+ Add plant/i }))
    expect(await screen.findByRole('heading', { name: /Add a houseplant/i })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Plant name/i), { target: { value: 'Peace Lily' } })
    fireEvent.change(screen.getByLabelText(/Species/i), { target: { value: 'Spathiphyllum' } })
    fireEvent.click(screen.getByRole('button', { name: /Save plant/i }))

    expect(await screen.findByText('Peace Lily')).toBeInTheDocument()

    const removeButtons = screen.getAllByRole('button', { name: /Remove plant/i })
    fireEvent.click(removeButtons[0])
    await waitFor(() => expect(screen.queryByText('Peace Lily')).not.toBeInTheDocument())
  })
})
