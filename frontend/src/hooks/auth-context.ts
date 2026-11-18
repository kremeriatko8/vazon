import { createContext } from 'react'
import type { LoginOptions } from '../services/authService'
import type { AuthCredentials, AuthUser } from '../types/api'

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginOptions) => Promise<void>
  loginWithToken: (accessToken: string, user?: AuthUser | null) => Promise<void>
  register: (credentials: AuthCredentials) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
