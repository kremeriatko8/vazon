import { API_BASE_URL, apiClient, buildUrl } from './apiClient'
import type { AuthCredentials, AuthResponse, AuthUser } from '../types/api'

const TOKEN_KEY = 'vazon_access_token'
const USER_KEY = 'vazon_user'

export const getStoredToken = () =>
  localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)

export const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as AuthUser) : null
}

export function saveSession(auth: AuthResponse, rememberMe = true): void {
  clearSession()
  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, auth.accessToken)
  storage.setItem(USER_KEY, JSON.stringify(auth.user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export interface LoginOptions extends AuthCredentials {
  rememberMe?: boolean
}

export async function loginUser(credentials: LoginOptions): Promise<AuthResponse> {
  const email = credentials.email.trim().toLowerCase()
  const res = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password: credentials.password,
  })
  saveSession(res, credentials.rememberMe ?? true)
  return res
}

export async function registerUser(credentials: AuthCredentials): Promise<AuthResponse> {
  const email = credentials.email.trim().toLowerCase()
  const res = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password: credentials.password,
  })
  saveSession(res, true)
  return res
}

function decodeJwtUser(token: string): AuthUser | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const parsed = JSON.parse(atob(base64)) as { sub?: string; id?: string; email?: string }
    if (parsed.email) {
      return { id: parsed.sub ?? parsed.id ?? 'oauth-user', email: parsed.email }
    }
    return null
  } catch {
    return null
  }
}

export async function completeOAuthLogin(
  accessToken: string,
  providedUser?: AuthUser | null,
): Promise<AuthResponse> {
  const placeholderUser: AuthUser = providedUser ?? decodeJwtUser(accessToken) ?? {
    id: 'oauth-user',
    email: 'google-user@vazon.app',
  }
  saveSession({ accessToken, user: placeholderUser }, true)

  if (providedUser) {
    return { accessToken, user: providedUser }
  }

  try {
    const me = await apiClient.get<AuthUser>('/auth/me')
    if (me?.email) {
      saveSession({ accessToken, user: me }, true)
      return { accessToken, user: me }
    }
  } catch {
    // Fallback to decoded JWT or placeholder user if /auth/me is unavailable
  }

  return { accessToken, user: placeholderUser }
}

export function getGoogleOAuthUrl(): string {
  return buildUrl(API_BASE_URL, '/auth/google')
}
