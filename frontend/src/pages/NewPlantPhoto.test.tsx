import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { setupApiMock } from '../testApiMock'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('vazon_access_token', 'jwt-token')
  localStorage.setItem('vazon_user', JSON.stringify({ id: 'u1', email: 'owner@example.test' }))
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:preview', revokeObjectURL: () => undefined }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const plant = {
  id: 'plant-1',
  ownerId: 'u1',
  name: 'Office fig',
  species: 'Ficus lyrata',
  lightCondition: 'BRIGHT_INDIRECT' as const,
  potSize: 'MEDIUM' as const,
  radiatorDistance: 'NONE' as const,
  createdAt: '2026-11-01T10:00:00.000Z',
}

describe('Plant photo', () => {
  it('uploads the chosen file as multipart and shows it', async () => {
    const state = setupApiMock({ plants: [{ ...plant }] })
    const fetchMock = vi.mocked(fetch)
    render(<MemoryRouter initialEntries={['/plants/plant-1']}><App /></MemoryRouter>)

    const input = await screen.findByLabelText('Add photo')
    fireEvent.change(input, { target: { files: [new File(['jpeg-bytes'], 'fig.jpg', { type: 'image/jpeg' })] } })

    await waitFor(() => expect(state.plants[0]?.photoUrl).toMatch(/\/uploads\//))
    const uploadCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/photo'))
    expect(uploadCall?.[1]?.body).toBeInstanceOf(FormData)
    expect((uploadCall?.[1]?.headers as Record<string, string>)['Content-Type']).toBeUndefined()
    expect(await screen.findByText('Change photo')).toBeInTheDocument()
  })

  it('rejects a file that is not JPEG, PNG or WebP before sending anything', async () => {
    setupApiMock({ plants: [{ ...plant }] })
    const fetchMock = vi.mocked(fetch)
    render(<MemoryRouter initialEntries={['/plants/plant-1']}><App /></MemoryRouter>)

    const input = await screen.findByLabelText('Add photo')
    fireEvent.change(input, { target: { files: [new File(['gif'], 'a.gif', { type: 'image/gif' })] } })

    expect(await screen.findByText('The photo must be a JPEG, PNG or WebP image.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/photo'))).toBe(false)
  })
})
