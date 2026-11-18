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

function fillForm() {
  fireEvent.change(screen.getByLabelText(/Species/i), { target: { value: 'Ficus lyrata' } })
  fireEvent.change(screen.getByLabelText(/Plant name/i), { target: { value: 'Office fig' } })
}

describe('Add plant with a photo', () => {
  it('creates the plant as JSON, then uploads the file as multipart', async () => {
    const state = setupApiMock()
    const fetchMock = vi.mocked(fetch)
    render(<MemoryRouter initialEntries={['/plants/new']}><App /></MemoryRouter>)

    await screen.findByRole('heading', { name: 'Add a houseplant' })
    fillForm()
    const file = new File(['jpeg-bytes'], 'fig.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/Photo/i), { target: { files: [file] } })
    expect(await screen.findByAltText('Photo preview')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save plant' }))

    await waitFor(() => expect(state.plants[0]?.photoUrl).toMatch(/\/uploads\//))
    const createCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/plants') && init?.method === 'POST')
    expect(JSON.parse(String(createCall?.[1]?.body))).not.toHaveProperty('photoUrl')
    const uploadCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/photo'))
    expect(uploadCall?.[1]?.body).toBeInstanceOf(FormData)
    expect((uploadCall?.[1]?.headers as Record<string, string>)['Content-Type']).toBeUndefined()
  })

  it('rejects a file that is not JPEG, PNG or WebP before sending anything', async () => {
    setupApiMock()
    render(<MemoryRouter initialEntries={['/plants/new']}><App /></MemoryRouter>)

    await screen.findByRole('heading', { name: 'Add a houseplant' })
    const gif = new File(['gif'], 'a.gif', { type: 'image/gif' })
    fireEvent.change(screen.getByLabelText(/Photo/i), { target: { files: [gif] } })

    expect(await screen.findByText('The photo must be a JPEG, PNG or WebP image.')).toBeInTheDocument()
    expect(screen.queryByAltText('Photo preview')).not.toBeInTheDocument()
  })
})
