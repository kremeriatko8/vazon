import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

afterEach(cleanup)

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('vazon_access_token', 'mock-token')
  localStorage.setItem('vazon_user', JSON.stringify({ id: 'u1', email: 'solomiia@example.com' }))
})

describe('Plants flow', () => {
  it('lists seed plants, filters by search, adds and removes a plant', async () => {
    render(<MemoryRouter initialEntries={['/plants']}><App /></MemoryRouter>)

    expect(await screen.findByText('Monstera Deliciosa')).toBeInTheDocument()
    expect(screen.getByText('Snake Plant')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), { target: { value: 'Snake' } })
    expect(screen.queryByText('Monstera Deliciosa')).not.toBeInTheDocument()
    expect(screen.getByText('Snake Plant')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: /\+ Add plant/i }))
    expect(await screen.findByRole('heading', { name: /Add a houseplant/i })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Plant name/i), { target: { value: 'Peace Lily' } })
    fireEvent.change(screen.getByLabelText(/Room \/ Location/i), { target: { value: 'Bathroom' } })
    fireEvent.click(screen.getByRole('button', { name: /Save plant/i }))

    expect(await screen.findByText('Peace Lily')).toBeInTheDocument()

    const removeButtons = screen.getAllByRole('button', { name: /Remove plant/i })
    fireEvent.click(removeButtons[0])
    await waitFor(() => expect(screen.queryByText('Peace Lily')).not.toBeInTheDocument())
  })
})
