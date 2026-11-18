# Vazon API contract

> **Status: AGREED by the team on 2026-11-18.**
> Endpoints marked **Planned** are not implemented yet. **Implemented** ones work in the code; on `feature/plants-api` that is health and the plant endpoints.
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
| GET | `/api/v1/plants` | Yes | Implemented |
| POST | `/api/v1/plants` | Yes | Implemented |
| GET | `/api/v1/plants/:plantId` | Yes | Implemented, contract under review |
| DELETE | `/api/v1/plants/:plantId` | Yes | Implemented, contract under review |
| POST | `/api/v1/plants/:plantId/photo` | Yes | Implemented, contract under review |
| DELETE | `/api/v1/plants/:plantId/photo` | Yes | Implemented, contract under review |
| GET | `/api/v1/species` | No | Implemented, contract under review |
| GET | `/api/v1/species/:speciesId` | No | Implemented, contract under review |
| GET | `/api/v1/plants/:plantId/care-logs` | Yes | Proposed |
| POST | `/api/v1/plants/:plantId/care-logs` | Yes | Proposed |

**Proposed** endpoints are already called by the frontend (`feature/plant-details`) and are waiting for team review in a pull request. After approval they become **Planned**. `GET` and `DELETE /plants/:plantId` are already implemented, but their contract has not been reviewed yet.

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

**Status: Implemented.** Auth required. Returns only the plants owned by the current user.

Response `200`: an array of [Plant](#plant-object) objects, newest first (by `createdAt`); empty if the user has none.

Errors: `401` if the token is missing or invalid.

### POST /api/v1/plants

**Status: Implemented.** Auth required. Creates a plant owned by the current user. The owner always comes from the token.

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
| `400` | Missing fields, an invalid enum value, or an unknown field (for example `ownerId`) |
| `401` | Token missing or invalid, or the token's user no longer exists |

Field rules:

| Field | Required | Rules |
| --- | --- | --- |
| `name` | yes | 1–100 characters after trimming spaces |
| `species` | yes | 1–150 characters after trimming spaces |
| `lightCondition` | yes | [`LightCondition`](#enums) |
| `potSize` | yes | [`PotSize`](#enums) |
| `radiatorDistance` | no | [`RadiatorDistance`](#enums); defaults to `NONE` |
| `speciesId` | no | An `id` from [`GET /species`](#get-apiv1species). Unknown or malformed id: `400`. `species` is still required; the frontend fills it from the chosen species. |

### GET /api/v1/plants/:plantId

**Status: Implemented, contract under review.** Auth required. Returns one plant owned by the current user.

Response `200`: one [Plant](#plant-object).

Errors: `401` if the token is missing or invalid; `404` if the plant does not exist, belongs to another user, or the id is not a UUID.

### DELETE /api/v1/plants/:plantId

**Status: Implemented, contract under review.** Auth required. Deletes the plant together with its care tasks and care logs.

Response `204` with no body.

Errors: `401`; `404` if the plant does not exist, belongs to another user, or the id is not a UUID.

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

### POST /api/v1/plants/:plantId/photo

**Status: Implemented, contract under review.** Auth required. Uploads the plant's photo, or replaces the existing one (the old file is deleted).

Request: `multipart/form-data` with one file in the field `photo`. JPEG, PNG or WebP, up to 5 MB. The type is checked from the file content, not its name; SVG and other formats are rejected.

Response `200`: the updated [Plant](#plant-object) with `photoUrl` set.

Errors:

| Status | When |
| --- | --- |
| `400` | No file in `photo`, a file in another field, or not a JPEG, PNG or WebP image |
| `401` | Token missing or invalid |
| `404` | See [ownership rule](#get-apiv1plantsplantid) (missing, another user's plant, or not a UUID) |
| `413` | The file is larger than 5 MB |

### DELETE /api/v1/plants/:plantId/photo

**Status: Implemented, contract under review.** Auth required. Removes the photo; does nothing if there is none.

Response `200`: the updated [Plant](#plant-object) with `photoUrl: null`.

Errors: `401`, `404`.

### Photo files

`photoUrl` is a path such as `/api/v1/uploads/3f2b8c1e6a4d4e0f9b7a1c2d3e4f5a6b.jpg`. Join it with the API origin (the part of `VITE_API_URL` before `/api/v1`) and use it in `<img src>`. No token is needed: names are random and cannot be guessed. A new photo always gets a new name, so browsers may cache it for a long time. Deleting the photo or the plant deletes the file.

### GET /api/v1/species

**Status: Implemented, contract under review.** No auth: the catalog has no user data. Search for the "add a plant" form (autocomplete).

Query parameters:

| Parameter | Required | Notes |
| --- | --- | --- |
| `search` | no | Part of `scientificName` or `commonName`, case-insensitive, up to 100 characters. Without it, the catalog is listed alphabetically. |
| `limit` | no | 1–100, default 10 |

Response `200`: an array of [Species](#species-object) objects, ordered by `commonName` (empty if nothing matches).

Errors: `400` (`limit` out of range or not a number, `search` too long, unknown parameter).

### GET /api/v1/species/:speciesId

**Status: Implemented, contract under review.** No auth.

Response `200`: one [Species](#species-object).

Errors: `404` if the species does not exist or the id is not a UUID.

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
  "speciesId": "string or null",
  "photoUrl": "/api/v1/uploads/3f2b8c1e6a4d4e0f9b7a1c2d3e4f5a6b.jpg",
  "createdAt": "2026-11-18T09:30:00.000Z"
}
```

The fields follow the `Plant` model in `backend/prisma/schema.prisma`. `lightCondition`, `potSize` and `radiatorDistance` use the [enum values](#enums) above. `speciesId` links to the [species catalog](#species-object), or is `null`. `photoUrl` is the owner's photo (see [Photo files](#photo-files)), or `null`; when it is `null`, the frontend can show the species photo instead.

## Species object

```json
{
  "id": "string",
  "scientificName": "Monstera Deliciosa",
  "commonName": "Swiss Cheese Plant",
  "recommendedLight": "BRIGHT_INDIRECT",
  "photoUrl": null,
  "photoAttribution": null
}
```

| Field | Notes |
| --- | --- |
| `scientificName` | Botanical name as written in the source; may include a cultivar |
| `commonName` | One name for both interface languages |
| `recommendedLight` | [`LightCondition`](#enums); a good default for the plant's `lightCondition` |
| `photoUrl`, `photoAttribution` | `null` for now. Photos will come from Wikimedia Commons; when `photoUrl` is set, show `photoAttribution` next to it |

The catalog (93 species) is inserted by a data migration. Its source and verification status are described in `backend/prisma/migrations/*_seed_species_catalog/migration.sql`.

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
