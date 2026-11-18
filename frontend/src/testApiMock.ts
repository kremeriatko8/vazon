import { vi } from 'vitest'
import type { CareActionType, CareLog, CreatePlantInput, Plant, UpdatePlantInput } from './types/plant'

interface MockState {
  plants: Plant[]
  logs: CareLog[]
}

export function setupApiMock(initial?: Partial<MockState>) {
  const state: MockState = {
    plants: initial?.plants ? [...initial.plants] : [],
    logs: initial?.logs ? [...initial.logs] : [],
  }

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const method = (init?.method ?? 'GET').toUpperCase()
    const body =
      typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : undefined

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })

    if (url.endsWith('/auth/register') && method === 'POST') {
      return json({
        accessToken: 'jwt-test-token',
        user: { id: 'u-1', email: String(body?.email ?? 'a@b.com') },
      }, 201)
    }

    if (url.endsWith('/auth/login') && method === 'POST') {
      if (body?.password === 'wrong') {
        return json({ statusCode: 401, message: 'Invalid email or password.', error: 'Unauthorized', path: '/api/v1/auth/login', timestamp: new Date().toISOString() }, 401)
      }
      return json({
        accessToken: 'jwt-test-token',
        user: { id: 'u-1', email: String(body?.email ?? 'a@b.com') },
      })
    }

    if (url.endsWith('/plants') && method === 'GET') {
      return json(state.plants)
    }

    if (url.endsWith('/plants') && method === 'POST') {
      const payload = body as unknown as CreatePlantInput
      const now = new Date().toISOString()
      const created: Plant = {
        id: `plant-${state.plants.length + 10}`,
        ownerId: 'u-1',
        name: payload.name,
        species: payload.species,
        lightCondition: payload.lightCondition,
        potSize: payload.potSize,
        radiatorDistance: payload.radiatorDistance,
        location: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
      }
      state.plants = [created, ...state.plants]
      return json(created, 201)
    }

    const plantDetailMatch = url.match(/\/plants\/([^/]+)$/)
    if (plantDetailMatch) {
      const id = plantDetailMatch[1]
      if (method === 'GET') {
        const found = state.plants.find((p) => p.id === id)
        return found ? json(found) : json({ statusCode: 404, message: 'Plant not found', error: 'Not Found', path: url, timestamp: new Date().toISOString() }, 404)
      }
      if (method === 'PATCH') {
        const patch = body as unknown as UpdatePlantInput
        state.plants = state.plants.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
        )
        const updated = state.plants.find((p) => p.id === id)
        return json(updated)
      }
      if (method === 'DELETE') {
        state.plants = state.plants.filter((p) => p.id !== id)
        return new Response(null, { status: 204 })
      }
    }

    const plantHistoryMatch = url.match(/\/plants\/([^/]+)\/care-history$/)
    if (plantHistoryMatch) {
      const plantId = plantHistoryMatch[1]
      if (method === 'GET') {
        return json(state.logs.filter((l) => l.plantId === plantId))
      }
      if (method === 'POST') {
        const created: CareLog = {
          id: `log-${state.logs.length + 10}`,
          plantId,
          actionType: (body?.actionType as CareActionType) ?? 'WATERED',
          actionDate: new Date().toISOString(),
          notes: typeof body?.notes === 'string' ? body.notes : null,
        }
        state.logs = [created, ...state.logs]
        return json(created, 201)
      }
    }

    if (url.endsWith('/care-history') && method === 'GET') {
      return json(state.logs)
    }

    const photoMatch = url.match(/\/plants\/([^/]+)\/photo$/)
    if (photoMatch && method === 'POST' && init?.body instanceof FormData) {
      const plant = state.plants.find((p) => p.id === photoMatch[1])
      if (!plant || !(init.body.get('photo') instanceof File)) {
        return json({ statusCode: 400, message: 'No photo', error: 'Bad Request', path: url, timestamp: new Date().toISOString() }, 400)
      }
      plant.photoUrl = `http://localhost:3100/api/v1/uploads/${plant.id}.jpg`
      return json(plant)
    }

    if (url.endsWith('/care-tasks') && method === 'GET') {
      return json(mockCareTasks(state))
    }

    return json({ statusCode: 404, message: `Unhandled mock route: ${method} ${url}`, error: 'Not Found', path: url, timestamp: new Date().toISOString() }, 404)
  })

  vi.stubGlobal('fetch', fetchMock)
  return state
}

const DAY_MS = 86_400_000

function utcDay(iso: string): string {
  return iso.slice(0, 10)
}

/** A simple stand-in for GET /care-tasks: one WATER task per plant, every wateringIntervalDays (default 7). */
function mockCareTasks(state: MockState) {
  const today = utcDay(new Date().toISOString())
  return state.plants
    .map((plant) => {
      const interval = plant.wateringIntervalDays ?? 7
      const lastDoneAt =
        state.logs.find((l) => l.plantId === plant.id && l.actionType === 'WATERED')?.actionDate ?? null
      const start = lastDoneAt ?? plant.createdAt
      const nextDueDate = utcDay(new Date(Date.parse(`${utcDay(start)}T00:00:00Z`) + interval * DAY_MS).toISOString())
      const status = nextDueDate < today ? 'OVERDUE' : nextDueDate === today ? 'TODAY' : 'UPCOMING'
      return {
        plantId: plant.id,
        plantName: plant.name,
        species: plant.species,
        taskType: 'WATER',
        lastDoneAt,
        nextDueDate,
        intervalDays: interval,
        status,
        waterAmountMl: { min: 200, max: 300 },
      }
    })
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
}
