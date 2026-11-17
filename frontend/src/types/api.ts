/**
 * Shapes of responses returned by the Vazon REST API.
 * Keep these in sync with the backend DTOs and the Swagger docs at /api/v1/docs.
 */

export interface HealthResponse {
  status: 'ok'
  service: string
  timestamp: string
}

/** Error body produced by the backend's global exception filter. */
export interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error: string
  path: string
  timestamp: string
}
