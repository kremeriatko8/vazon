import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
    ],
    logs: [
      {
        id: 'log-1',
        plantId: 'plant-1',
        actionType: 'WATERED',
        actionDate: '2026-11-12T09:00:00.000Z',
        notes: 'Filtered room-temperature water.',
      },
    ],
  })
})

describe('Plant detail & care log flow', () => {
  it('opens plant profile, displays care history, and logs a new care action', async () => {
    render(<MemoryRouter initialEntries={['/plants/plant-1']}><App /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Monstera Deliciosa' })).toBeInTheDocument()
    expect(screen.getByText('Filtered room-temperature water.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Quick care log/i), {
      target: { value: 'Fresh soil mix' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Repot/i }))

    expect(await screen.findByText('Fresh soil mix')).toBeInTheDocument()
    expect(screen.getByText('Repotted')).toBeInTheDocument()
  })

  it('edits plant details and persists changes', async () => {
    render(<MemoryRouter initialEntries={['/plants/plant-1']}><App /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Monstera Deliciosa' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Edit plant/i }))

    fireEvent.change(screen.getByLabelText(/Plant name/i), { target: { value: 'Big Monstera' } })
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }))

    expect(await screen.findByRole('heading', { name: 'Big Monstera' })).toBeInTheDocument()
  })
})
