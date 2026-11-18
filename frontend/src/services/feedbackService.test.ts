import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './apiClient'
import { sendFeedback } from './feedbackService'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('sendFeedback', () => {
  it('POSTs the input to /feedback and returns the created record', async () => {
    const created = { id: 'fb-1', createdAt: '2026-11-18T09:30:00.000Z' }
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(created)

    const input = { category: 'BUG' as const, message: 'Rating: 4/5\nButton is broken', page: '/tasks' }
    await expect(sendFeedback(input)).resolves.toEqual(created)

    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('/feedback', input)
  })
})
