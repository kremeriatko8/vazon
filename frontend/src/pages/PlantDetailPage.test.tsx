import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

afterEach(cleanup)

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('vazon_access_token', 'mock-token')
  localStorage.setItem('vazon_user', JSON.stringify({ id: 'u1', email: 'solomiia@example.com' }))
})

describe('Plant detail & care log flow', () => {
  it('opens plant profile, displays care history, and logs a new care action', async () => {
    render(<MemoryRouter initialEntries={['/plants/plant-1']}><App /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Monstera Deliciosa' })).toBeInTheDocument()
    expect(screen.getByText('Filtered room-temperature water.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Quick care log/i), {
      target: { value: 'Morning misting session' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Mist leaves/i }))

    expect(await screen.findByText('Morning misting session')).toBeInTheDocument()
    expect(screen.getByText('Misted leaves')).toBeInTheDocument()
  })
})
