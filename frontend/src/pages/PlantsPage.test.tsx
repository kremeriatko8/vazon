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
  it('lists plants, filters by search, and removes a plant after confirming', async () => {
    render(<MemoryRouter initialEntries={['/plants']}><App /></MemoryRouter>)

    expect(await screen.findByText('Monstera Deliciosa')).toBeInTheDocument()
    expect(screen.getByText('Snake Plant')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), { target: { value: 'Snake' } })
    expect(screen.queryByText('Monstera Deliciosa')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove: Snake Plant' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(screen.queryByText('Snake Plant')).not.toBeInTheDocument())
  })

  it('adds a plant under the owner’s own name when it is not in the catalog', async () => {
    const state = setupApiMock()
    render(<MemoryRouter initialEntries={['/plants']}><App /></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: /Add a plant/i }))
    expect(await screen.findByRole('heading', { name: /Grow your collection/i })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Plant species or nickname/i), { target: { value: 'Kitchen cactus' } })
    fireEvent.change(screen.getByLabelText(/Where does it live/i), { target: { value: 'Kitchen' } })
    fireEvent.click(screen.getByRole('button', { name: /Create care plan/i }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save anyway' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Kitchen cactus' })).toBeInTheDocument()
    await waitFor(() => expect(state.lastCreate).toBeTruthy())
    expect(state.lastCreate).toMatchObject({ name: 'Kitchen cactus', species: 'Kitchen cactus', location: 'Kitchen' })
    expect(state.lastCreate).not.toHaveProperty('speciesId')
  })
})
