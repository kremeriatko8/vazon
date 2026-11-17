import { ApiError, apiClient } from './apiClient'
import type { AuthCredentials, AuthResponse, AuthUser } from '../types/api'

const TOKEN_KEY = 'vazon_access_token'
const USER_KEY = 'vazon_user'
const MOCK_USERS_KEY = 'vazon_mock_users'
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== 'false'

interface StoredMockUser {
  id: string
  email: string
  password: string
}

const getMockUsers = (): StoredMockUser[] =>
  JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]')

const saveMockUsers = (users: StoredMockUser[]) =>
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY)

export const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as AuthUser) : null
}

export function saveSession(auth: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, auth.accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function loginUser(credentials: AuthCredentials): Promise<AuthResponse> {
  const email = credentials.email.trim().toLowerCase()
  const { password } = credentials

  if (!USE_MOCK_AUTH) {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password })
    saveSession(res)
    return res
  }

  if (email === 'error@vazon.app') {
    throw new ApiError(500, 'Server temporarily unavailable. Please try again later.')
  }

  const found = getMockUsers().find((u) => u.email === email && u.password === password)
  if (!found) throw new ApiError(401, 'Invalid email or password.')

  const res: AuthResponse = { accessToken: `mock-jwt-${found.id}`, user: { id: found.id, email } }
  saveSession(res)
  return res
}

export async function registerUser(credentials: AuthCredentials): Promise<AuthResponse> {
  const email = credentials.email.trim().toLowerCase()
  const { password } = credentials

  if (!USE_MOCK_AUTH) {
    const res = await apiClient.post<AuthResponse>('/auth/register', { email, password })
    saveSession(res)
    return res
  }

  if (email === 'error@vazon.app') {
    throw new ApiError(500, 'Server temporarily unavailable. Please try again later.')
  }

  const users = getMockUsers()
  if (users.some((u) => u.email === email)) {
    throw new ApiError(409, 'An account with this email already exists.')
  }

  const newUser: StoredMockUser = { id: crypto.randomUUID(), email, password }
  saveMockUsers([...users, newUser])

  const res: AuthResponse = { accessToken: `mock-jwt-${newUser.id}`, user: { id: newUser.id, email } }
  saveSession(res)
  return res
}
