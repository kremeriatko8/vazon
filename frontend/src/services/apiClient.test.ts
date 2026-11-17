import { describe, expect, it } from 'vitest'
import { buildUrl, resolveApiBaseUrl } from './apiClient'

describe('resolveApiBaseUrl', () => {
  it('falls back to the local development API when the variable is missing', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('http://localhost:3100/api/v1')
    expect(resolveApiBaseUrl('   ')).toBe('http://localhost:3100/api/v1')
  })

  it('removes trailing slashes from a configured URL', () => {
    expect(resolveApiBaseUrl('https://api.example.com/api/v1/')).toBe(
      'https://api.example.com/api/v1',
    )
  })
})

describe('buildUrl', () => {
  it('joins the base URL and path with exactly one slash', () => {
    expect(buildUrl('http://localhost:3100/api/v1', '/health')).toBe(
      'http://localhost:3100/api/v1/health',
    )
    expect(buildUrl('http://localhost:3100/api/v1', 'health')).toBe(
      'http://localhost:3100/api/v1/health',
    )
  })
})
