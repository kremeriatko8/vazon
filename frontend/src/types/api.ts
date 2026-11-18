export interface HealthResponse {
  status: 'ok'
  service: string
  timestamp: string
}

export interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error: string
  path: string
  timestamp: string
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}
