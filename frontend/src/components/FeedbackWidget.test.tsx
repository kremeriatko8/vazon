import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '../i18n'
import { sendFeedback } from '../services/feedbackService'
import { FeedbackWidget } from './FeedbackWidget'

vi.mock('../services/feedbackService', () => ({ sendFeedback: vi.fn() }))

const mockedSendFeedback = vi.mocked(sendFeedback)

function openAndType(text: string) {
  render(<FeedbackWidget />)
  fireEvent.click(screen.getByRole('button', { name: /Leave feedback/i }))
  const textarea = screen.getByRole('textbox')
  fireEvent.change(textarea, { target: { value: text } })
  return textarea as HTMLTextAreaElement
}

beforeEach(() => {
  mockedSendFeedback.mockReset()
  window.history.pushState({}, '', '/tasks')
})

afterEach(() => {
  cleanup()
})

describe('FeedbackWidget', () => {
  it('sends the chosen category, the current page and the rating inside the message', async () => {
    mockedSendFeedback.mockResolvedValue({ id: 'fb-1', createdAt: '2026-11-18T09:30:00.000Z' })
    const textarea = openAndType('The tasks page is great')

    const bug = screen.getByRole('button', { name: 'Bug' })
    expect(screen.getByRole('button', { name: 'Idea' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(bug)
    expect(bug).toHaveAttribute('aria-pressed', 'true')

    fireEvent.submit(textarea.closest('form')!)
    await screen.findByText(/Thank you! Your feedback has been recorded/i)

    expect(mockedSendFeedback).toHaveBeenCalledTimes(1)
    const input = mockedSendFeedback.mock.calls[0][0]
    expect(input.category).toBe('BUG')
    expect(input.page).toBe('/tasks')
    expect(input.message.startsWith('Rating: 5/5\n')).toBe(true)
    expect(input.message).toBe('Rating: 5/5\nThe tasks page is great')
  })

  it('shows an alert and keeps the text when sending fails', async () => {
    mockedSendFeedback.mockRejectedValue(new Error('Network down'))
    const textarea = openAndType('Please keep this text')

    fireEvent.submit(textarea.closest('form')!)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not send feedback. Please try again.',
    )
    expect(screen.getByRole('textbox')).toHaveValue('Please keep this text')
    expect(screen.queryByText(/Thank you!/i)).not.toBeInTheDocument()
  })

  it('shows the thank-you text only after the server confirms', async () => {
    let confirm!: (value: { id: string; createdAt: string }) => void
    mockedSendFeedback.mockReturnValue(new Promise((resolve) => (confirm = resolve)))
    const textarea = openAndType('Love the watering reminders!')

    fireEvent.submit(textarea.closest('form')!)
    expect(await screen.findByRole('button', { name: 'Sending...' })).toBeDisabled()
    expect(screen.queryByText(/Thank you!/i)).not.toBeInTheDocument()

    confirm({ id: 'fb-2', createdAt: '2026-11-18T09:30:00.000Z' })
    expect(await screen.findByText(/Thank you! Your feedback has been recorded/i)).toBeInTheDocument()
  })
})
