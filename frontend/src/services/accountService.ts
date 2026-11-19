import i18n from '../i18n'
import { apiClient } from './apiClient'

/** The interface language, so the email comes in the same language. */
const language = () => (i18n.language === 'uk' ? 'uk' : 'en')

/** GET /api/v1/account */
export interface Account {
  email: string
  emailVerified: boolean
  hasPassword: boolean
  googleLinked: boolean
  createdAt: string
}

export function getAccount(): Promise<Account> {
  return apiClient.get<Account>('/account')
}

/** Emails a link that confirms the address. 409 ALREADY_VERIFIED when not needed. */
export async function sendVerificationEmail(): Promise<void> {
  await apiClient.post('/account/email-verification', { language: language() })
}

export async function confirmEmail(token: string): Promise<void> {
  await apiClient.post('/account/email-verification/confirm', { token })
}

/** Always succeeds for a well-formed email, so it does not reveal who has an account. */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/account/password-reset', { email: email.trim().toLowerCase(), language: language() })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/account/password-reset/confirm', { token, password })
}

/** Deletes the account with all its data. The email is typed again to confirm. */
export async function deleteAccount(confirmEmail: string): Promise<void> {
  await apiClient.delete('/account', {
    body: JSON.stringify({ confirmEmail }),
    headers: { 'Content-Type': 'application/json' },
  })
}
