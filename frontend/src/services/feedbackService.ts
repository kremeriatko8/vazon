import { apiClient } from './apiClient'

export type FeedbackCategory = 'BUG' | 'IDEA' | 'OTHER'

export interface SendFeedbackInput {
  category: FeedbackCategory
  message: string
  page?: string
}

export interface FeedbackCreated {
  id: string
  createdAt: string
}

export async function sendFeedback(input: SendFeedbackInput): Promise<FeedbackCreated> {
  return apiClient.post<FeedbackCreated>('/feedback', input)
}
