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

export function getGoogleOAuthUrl(): string {
  return buildUrl(API_BASE_URL, '/auth/google')
}
