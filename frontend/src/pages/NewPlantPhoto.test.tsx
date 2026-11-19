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

/** Picks Ficus lyrata from the catalog and names the plant. */
async function chooseFicus() {
  fireEvent.change(await screen.findByLabelText('Species'), { target: { value: 'ficus' } })
  fireEvent.click(await screen.findByRole('button', { name: /Fiddle Leaf Fig/i }))
  fireEvent.change(await screen.findByLabelText('Plant name'), { target: { value: 'Office fig' } })
}

describe('Add plant with a photo', () => {
  it('creates the plant as JSON, then uploads the file as multipart', async () => {
    const state = setupApiMock()
    const fetchMock = vi.mocked(fetch)
    render(<MemoryRouter initialEntries={['/plants/new']}><App /></MemoryRouter>)

    await chooseFicus()
    const file = new File(['jpeg-bytes'], 'fig.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/Photo/i), { target: { files: [file] } })
    expect(await screen.findByAltText('Photo preview')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save plant' }))

    await waitFor(() => expect(state.plants[0]?.photoUrl).toMatch(/\/uploads\//))
    const createCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/plants') && init?.method === 'POST')
    const sent = JSON.parse(String(createCall?.[1]?.body)) as Record<string, unknown>
    expect(sent).not.toHaveProperty('photoUrl')
    expect(sent).toMatchObject({ name: 'Office fig', species: 'Ficus lyrata', speciesId: 'sp-ficus' })
    const uploadCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/photo'))
    expect(uploadCall?.[1]?.body).toBeInstanceOf(FormData)
    expect((uploadCall?.[1]?.headers as Record<string, string>)['Content-Type']).toBeUndefined()
  })

  it('rejects a file that is not JPEG, PNG or WebP before sending anything', async () => {
    setupApiMock()
    render(<MemoryRouter initialEntries={['/plants/new']}><App /></MemoryRouter>)

    await chooseFicus()
    const gif = new File(['gif'], 'a.gif', { type: 'image/gif' })
    fireEvent.change(screen.getByLabelText(/Photo/i), { target: { files: [gif] } })

    expect(await screen.findByText('The photo must be a JPEG, PNG or WebP image.')).toBeInTheDocument()
    expect(screen.queryByAltText('Photo preview')).not.toBeInTheDocument()
  })
})
