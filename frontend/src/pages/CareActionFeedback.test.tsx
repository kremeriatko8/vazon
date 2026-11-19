import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { ApiError } from '../services/apiClient'
import { logCareAction } from '../services/careLogService'
import { setupApiMock } from '../testApiMock'
import type { CareLog, Plant } from '../types/plant'

vi.mock('../services/careLogService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/careLogService')>()),
  logCareAction: vi.fn(),
}))

const mockedLogCareAction = vi.mocked(logCareAction)
const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

const plant: Plant = {
  id: 'p-1',
  ownerId: 'u1',
  name: 'Fiddle Leaf Fig',
  species: 'Ficus lyrata',
  lightCondition: 'BRIGHT_INDIRECT',
  potSize: 'LARGE',
  radiatorDistance: 'FAR',
  wateringIntervalDays: 7,
  createdAt: tenDaysAgo,
  updatedAt: tenDaysAgo,
}

function loggedEntry(actionType: CareLog['actionType']): CareLog {
  return {
    id: 'log-new',
    plantId: plant.id,
    actionType,
    actionDate: new Date().toISOString(),
    notes: null,
  }
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('vazon_access_token', 'jwt-token')
  localStorage.setItem('vazon_user', JSON.stringify({ id: 'u1', email: 'owner@example.test' }))
  setupApiMock({ plants: [plant] })
  mockedLogCareAction.mockReset()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('care action confirmation', () => {
  it('Tasks page: shows a confirmation with the next watering date after "Mark watered"', async () => {
    mockedLogCareAction.mockResolvedValue(loggedEntry('WATERED'))
    renderAt('/tasks')

    fireEvent.click(await screen.findByRole('button', { name: 'Mark watered' }))

    expect(
      await screen.findByText(/^Watered Fiddle Leaf Fig\. Next watering: \d{2}\.\d{2}\.\d{4}\.$/),
    ).toBeInTheDocument()
    expect(mockedLogCareAction).toHaveBeenCalledWith('p-1', 'WATERED', undefined)
  })

  it('Dashboard: shows a confirmation after "Soil still wet"', async () => {
    mockedLogCareAction.mockResolvedValue(loggedEntry('SOIL_WET'))
    renderAt('/dashboard')

    fireEvent.click(await screen.findByRole('button', { name: 'Soil still wet' }))

    expect(
      await screen.findByText('Soil still wet. Next watering moved a day later.'),
    ).toBeInTheDocument()
    expect(mockedLogCareAction).toHaveBeenCalledWith('p-1', 'SOIL_WET', undefined)
  })

  it('Plant page: shows a confirmation after "Feed"', async () => {
    mockedLogCareAction.mockResolvedValue(loggedEntry('FED'))
    renderAt('/plants/p-1')

    fireEvent.click(await screen.findByRole('button', { name: 'Fed' }))

    expect(await screen.findByText('Feeding logged for Fiddle Leaf Fig.')).toBeInTheDocument()
  })

  it('409 TOO_EARLY: asks first, and logs with confirm only after "Log anyway"', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    mockedLogCareAction
      .mockRejectedValueOnce(
        new ApiError(409, 'Watered yesterday.', {
          statusCode: 409,
          message: 'Watered yesterday.',
          error: 'Conflict',
          path: '/api/v1/plants/p-1/care-history',
          timestamp: new Date().toISOString(),
          code: 'TOO_EARLY',
          lastDoneAt: yesterday,
          nextDueDate: '2026-11-25',
        } as never),
      )
      .mockResolvedValueOnce(loggedEntry('WATERED'))
    renderAt('/tasks')

    fireEvent.click(await screen.findByRole('button', { name: 'Mark watered' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Watered yesterday. Log it anyway?')
    expect(dialog).toHaveTextContent('25.11.2026')
    expect(mockedLogCareAction).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Log anyway' }))

    expect(await screen.findByText(/^Watered Fiddle Leaf Fig\./)).toBeInTheDocument()
    expect(mockedLogCareAction).toHaveBeenLastCalledWith('p-1', 'WATERED', undefined, true)
  })

  it('409 TOO_EARLY: "Cancel" logs nothing', async () => {
    mockedLogCareAction.mockRejectedValueOnce(
      new ApiError(409, 'Too early', {
        statusCode: 409,
        message: 'Too early',
        error: 'Conflict',
        path: '/x',
        timestamp: new Date().toISOString(),
        code: 'TOO_EARLY',
        lastDoneAt: new Date().toISOString(),
        nextDueDate: '2026-11-25',
      } as never),
    )
    renderAt('/tasks')

    fireEvent.click(await screen.findByRole('button', { name: 'Mark watered' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(mockedLogCareAction).toHaveBeenCalledTimes(1)
  })

  it('shows an error message when saving fails', async () => {
    mockedLogCareAction.mockRejectedValue(new Error('Network down'))
    renderAt('/plants/p-1')

    fireEvent.click(await screen.findByRole('button', { name: 'Watered' }))

    expect(await screen.findByText('Could not save. Try again.')).toBeInTheDocument()
  })
})
