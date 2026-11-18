import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from './apiClient'

const SESSION_KEYS = ['vazon_access_token', 'vazon_user']

function seedSession() {
  localStorage.setItem('vazon_access_token', 'dead-token')
  localStorage.setItem('vazon_user', JSON.stringify({ id: 'u-1', email: 'owner@example.test' }))
  sessionStorage.setItem('vazon_access_token', 'dead-token')
  sessionStorage.setItem('vazon_user', JSON.stringify({ id: 'u-1', email: 'owner@example.test' }))
}

function mock401() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ statusCode: 401, message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ),
  )
}

describe('apiRequest on 401', () => {
  beforeEach(() => {
    seedSession()
    mock401()
    // jsdom cannot navigate; replace location so the redirect can be observed.
    vi.stubGlobal('location', { ...window.location, pathname: '/plants', assign: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('clears the session and redirects to /login for a protected path', async () => {
    await expect(apiRequest('/plants')).rejects.toBeInstanceOf(ApiError)
    for (const key of SESSION_KEYS) {
      expect(localStorage.getItem(key)).toBeNull()
      expect(sessionStorage.getItem(key)).toBeNull()
    }
    expect(window.location.assign).toHaveBeenCalledWith('/login')
  })

  it('keeps the session on a 401 from /auth/login (wrong password)', async () => {
    await expect(apiRequest('/auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      status: 401,
    })
    for (const key of SESSION_KEYS) {
      expect(localStorage.getItem(key)).not.toBeNull()
      expect(sessionStorage.getItem(key)).not.toBeNull()
    }
    expect(window.location.assign).not.toHaveBeenCalled()
  })
})
