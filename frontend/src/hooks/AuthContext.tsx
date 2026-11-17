import { useCallback, useState, type ReactNode } from 'react'
import { clearSession, getStoredToken, getStoredUser, loginUser, registerUser } from '../services/authService'
import type { AuthCredentials, AuthUser } from '../types/api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const login = useCallback(async (credentials: AuthCredentials) => {
    const res = await loginUser(credentials)
    setToken(res.accessToken)
    setUser(res.user)
  }, [])

  const register = useCallback(async (credentials: AuthCredentials) => {
    const res = await registerUser(credentials)
    setToken(res.accessToken)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(token), login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
