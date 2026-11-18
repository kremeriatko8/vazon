import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  loginUser,
  registerUser,
  type LoginOptions,
} from '../services/authService'
import type { AuthCredentials, AuthUser } from '../types/api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const login = useCallback(async (credentials: LoginOptions) => {
    const auth = await loginUser(credentials)
    setToken(auth.accessToken)
    setUser(auth.user)
  }, [])

  const register = useCallback(async (credentials: AuthCredentials) => {
    const auth = await registerUser(credentials)
    setToken(auth.accessToken)
    setUser(auth.user)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(token && user), login, register, logout }),
    [user, token, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
