# Vazon API contract

> **Status: AGREED by the team on 2026-11-18.**
> Endpoints marked **Planned** are not implemented. Only `GET /api/v1/health` exists today.
> Any change to this file follows the rules in [CONTRIBUTING.md](../CONTRIBUTING.md#api-contract).

## Conventions

- **Base path:** `/api/v1`
- **Format:** JSON only. Requests with a body send `Content-Type: application/json`.
- **Interactive docs:** Swagger UI at `/api/v1/docs` (implemented).
- **Timestamps:** ISO 8601 strings in UTC (for example, `2026-11-18T09:30:00.000Z`). The frontend displays them in `Europe/Kyiv`.
- **Authentication (planned):** endpoints marked "Auth required" expect `Authorization: Bearer <accessToken>`. The token comes from `POST /api/v1/auth/login`. Without a valid token, they return `401`.

### Error shape

All errors use one JSON shape:

```json
{
  "statusCode": 400,
  "message": "email must be an email",
  "path": "/api/v1/auth/register",
  "timestamp": "2026-11-18T09:30:00.000Z"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `statusCode` | number | HTTP status code |
| `message` | string or string[] | Validation errors return an array of messages |
| `path` | string | Full request path, including `/api/v1` |
| `timestamp` | string | UTC, ISO 8601 |

> **Note:** the current implementation (`backend/src/common/filters/http-exception.filter.ts`) also returns an `error` field (for example, `"Bad Request"`). The team should decide whether to keep it in the contract or remove it from the response.

## Enums

These values are copied from `backend/prisma/schema.prisma`. Send them exactly as written; they are case-sensitive.

| Enum | Values |
| --- | --- |
| `LightCondition` | `LOW`, `MEDIUM`, `BRIGHT_INDIRECT`, `DIRECT` |
| `PotSize` | `SMALL`, `MEDIUM`, `LARGE` |
| `RadiatorDistance` | `NEAR` (under 1 metre), `MEDIUM` (1–2 metres), `FAR` (more than 2 metres), `NONE` (no radiator in the room) |
| `CareActionType` | `WATERED`, `FED`, `REPOTTED`, `SOIL_WET` (the soil did not need water yet), `DONE` |

## Endpoints

| Method | Path | Auth | Status |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | No | Implemented |
| POST | `/api/v1/auth/register` | No | Planned |
| POST | `/api/v1/auth/login` | No | Planned |
| GET | `/api/v1/auth/me` | Yes | Planned |
| GET | `/api/v1/plants` | Yes | Planned |
| POST | `/api/v1/plants` | Yes | Planned |
| GET | `/api/v1/plants/:plantId` | Yes | Proposed |
| DELETE | `/api/v1/plants/:plantId` | Yes | Proposed |
| GET | `/api/v1/plants/:plantId/care-logs` | Yes | Proposed |
| POST | `/api/v1/plants/:plantId/care-logs` | Yes | Proposed |

**Proposed** endpoints are already called by the frontend (`feature/plant-details`) and are waiting for team review in a pull request. After approval they become **Planned**.

### GET /api/v1/health

**Status: Implemented.** A liveness check. It does not query the database.

Response `200`:

```json
{
  "status": "ok",
  "service": "vazon-backend",
  "timestamp": "2026-11-18T09:30:00.000Z"
}
```

### POST /api/v1/auth/register

**Status: Planned.** Creates a user account. The password is stored only as a hash.

Request:

```json
{
  "email": "owner@example.com",
  "password": "a-strong-password"
}
```

Response `201`:

```json
{
  "id": "string",
  "email": "owner@example.com"
}
```

Errors:

| Status | When |
| --- | --- |
| `400` | Invalid email, or the password does not meet the rules |
| `409` | The email is already registered |

### POST /api/v1/auth/login

**Status: Planned.**

Request:

```json
{
  "email": "owner@example.com",
  "password": "a-strong-password"
}
```

Response `200`:

```json
{
  "accessToken": "string"
}
```

Errors:

| Status | When |
| --- | --- |
| `400` | Missing or malformed fields |
| `401` | Wrong email or password (the same message for both) |

### GET /api/v1/auth/me

**Status: Planned.** Auth required.

Response `200`:

```json
{
  "id": "string",
  "email": "owner@example.com"
}
```

Errors: `401` if the token is missing or invalid.

### GET /api/v1/plants

**Status: Planned.** Auth required. Returns only the plants owned by the current user.

Response `200`: an array of [Plant](#plant-object) objects (empty if the user has none).

Errors: `401` if the token is missing or invalid.

### POST /api/v1/plants

**Status: Planned.** Auth required. Creates a plant owned by the current user.

Request:

```json
{
  "name": "Living room monstera",
  "species": "Monstera deliciosa",
  "lightCondition": "BRIGHT_INDIRECT",
  "potSize": "MEDIUM",
  "radiatorDistance": "FAR"
}
```

Response `201`: the created [Plant](#plant-object).

Errors:

| Status | When |
| --- | --- |
| `400` | Missing fields or an invalid enum value |
| `401` | Token missing or invalid |

### GET /api/v1/plants/:plantId

**Status: Proposed.** Auth required. Returns one plant owned by the current user.

Response `200`: one [Plant](#plant-object).

Errors: `401` if the token is missing or invalid; `404` if the plant does not exist or belongs to another user.

### DELETE /api/v1/plants/:plantId

**Status: Proposed.** Auth required. Deletes the plant together with its care logs.

Response `204` with no body.

Errors: `401`; `404` if the plant does not exist or belongs to another user.

### GET /api/v1/plants/:plantId/care-logs

**Status: Proposed.** Auth required. The care history of one plant.

Response `200`: an array of [CareLog](#carelog-object) objects (empty if there are none).

Errors: `401`; `404` if the plant does not exist or belongs to another user.

### POST /api/v1/plants/:plantId/care-logs

**Status: Proposed.** Auth required. Records a care action for the plant.

Request:

```json
{
  "action": "WATERED",
  "note": "Filtered room-temperature water."
}
```

`action` is one of `WATERED`, `FED`, `REPOTTED`, `SOIL_WET` ([`CareActionType`](#enums)). `note` is optional, up to 1000 characters.

Response `201`: the created [CareLog](#carelog-object). `performedAt` is the time of the request.

Errors: `400` (missing or invalid `action`), `401`, `404`.

## Plant object

```json
{
  "id": "string",
  "ownerId": "string",
  "name": "Living room monstera",
  "species": "Monstera deliciosa",
  "lightCondition": "BRIGHT_INDIRECT",
  "potSize": "MEDIUM",
  "radiatorDistance": "FAR",
  "createdAt": "2026-11-18T09:30:00.000Z"
}
```

The fields follow the `Plant` model in `backend/prisma/schema.prisma`. `lightCondition`, `potSize` and `radiatorDistance` use the [enum values](#enums) above.

## CareLog object

One row of `CareHistory` in `backend/prisma/schema.prisma`. The API uses shorter names than the database; the backend maps them:

```json
{
  "id": "string",
  "plantId": "string",
  "action": "WATERED",
  "performedAt": "2026-11-18T09:30:00.000Z",
  "note": null
}
```

| API field | Database column (`CareHistory`) |
| --- | --- |
| `action` | `actionType` |
| `performedAt` | `actionDate` |
| `note` | `notes` (`null` when empty) |

The list from `GET /plants/:plantId/care-logs` is ordered by `performedAt`, newest first.
