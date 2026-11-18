# Vazon API contract

> **Status: AGREED by the team on 2026-11-18.**
> Endpoints marked **Planned** are not implemented yet. **Implemented** ones work in the code; on `feature/plants-api` that is health, auth, plants, species and feedback.
> Any change to this file follows the rules in [CONTRIBUTING.md](../CONTRIBUTING.md#api-contract).

## Conventions

- **Base path:** `/api/v1`
- **Format:** JSON only. Requests with a body send `Content-Type: application/json`.
- **Interactive docs:** Swagger UI at `/api/v1/docs` (implemented).
- **Timestamps:** ISO 8601 strings in UTC (for example, `2026-11-18T09:30:00.000Z`). The frontend displays them in `Europe/Kyiv`.
- **Authentication (implemented):** endpoints marked "Auth required" expect `Authorization: Bearer <accessToken>`. The token comes from `POST /api/v1/auth/login`. Without a valid token, they return `401`.

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
| POST | `/api/v1/auth/register` | No | Implemented |
| POST | `/api/v1/auth/login` | No | Implemented |
| GET | `/api/v1/auth/me` | Yes | Implemented |
| GET | `/api/v1/auth/google` | No | Implemented (browser redirect) |
| GET | `/api/v1/auth/google/callback` | No | Implemented (browser redirect) |
| GET | `/api/v1/plants` | Yes | Implemented |
| POST | `/api/v1/plants` | Yes | Implemented |
| GET | `/api/v1/plants/:plantId` | Yes | Implemented, contract under review |
| PATCH | `/api/v1/plants/:plantId` | Yes | Implemented, contract under review |
| DELETE | `/api/v1/plants/:plantId` | Yes | Implemented, contract under review |
| POST | `/api/v1/plants/:plantId/photo` | Yes | Implemented, contract under review |
| DELETE | `/api/v1/plants/:plantId/photo` | Yes | Implemented, contract under review |
| GET | `/api/v1/species` | No | Implemented, contract under review |
| POST | `/api/v1/feedback` | Optional | Implemented, contract under review |
| GET | `/api/v1/me/settings` | Yes | Implemented, contract under review |
| PATCH | `/api/v1/me/settings` | Yes | Implemented, contract under review |
| GET | `/api/v1/species/:speciesId` | No | Implemented, contract under review |
| GET | `/api/v1/plants/:plantId/care-history` | Yes | Implemented |
| POST | `/api/v1/plants/:plantId/care-history` | Yes | Implemented |
| GET | `/api/v1/care-history` | Yes | Implemented |

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

**Status: Implemented.** Creates a user account. The password is stored only as a hash.

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
  "accessToken": "string",
  "user": {
    "id": "string",
    "email": "owner@example.com"
  }
}
```

Errors:

| Status | When |
| --- | --- |
| `400` | Invalid email, or the password does not meet the rules |
| `409` | The email is already registered |

### POST /api/v1/auth/login

**Status: Implemented.**

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
  "accessToken": "string",
  "user": {
    "id": "string",
    "email": "owner@example.com"
  }
}
```

Errors:

| Status | When |
| --- | --- |
| `400` | Missing or malformed fields |
| `401` | Wrong email or password (the same message for both) |

### GET /api/v1/auth/me

**Status: Implemented.** Auth required.

Response `200`:

```json
{
  "id": "string",
  "email": "owner@example.com"
}
```

Errors: `401` if the token is missing or invalid.

### GET /api/v1/auth/google

**Status: Implemented.** Open this URL in the browser (a link, not `fetch`). It redirects to Google's account picker. Only the `openid email` scopes are requested.

When Google sign-in is not configured on the server (`GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` missing), it redirects straight back to `<FRONTEND_URL>/auth/callback?error=google_not_configured`.

### GET /api/v1/auth/google/callback

**Status: Implemented.** Google redirects here; the frontend never calls it. It always ends with a redirect to the frontend:

- success: `<FRONTEND_URL>/auth/callback#accessToken=<jwt>`. The token is in the fragment, so it is not sent to any server or logged. The frontend then calls `GET /auth/me` for the user.
- failure: `<FRONTEND_URL>/auth/callback?error=<code>`, where `<code>` is one of `access_denied` (the user cancelled), `invalid_state` (missing or mismatched state cookie), `email_not_verified`, `code_exchange_failed`, `profile_failed`, `account_conflict`, `google_error`.

Account rules: a returning Google user is found by Google id. Otherwise an existing account with the same (verified) email is linked, and its password is removed, because registration does not verify email ownership. Otherwise a new account without a password is created. Accounts without a password cannot use `POST /auth/login` (it returns `401` like an unknown email).

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
| `location` | no | Where the plant stands, up to 100 characters after trimming. Empty string or `null` is stored as `null` |
| `notes` | no | Free notes, up to 1000 characters after trimming. Empty string or `null` is stored as `null` |

### GET /api/v1/plants/:plantId

**Status: Implemented, contract under review.** Auth required. Returns one plant owned by the current user.

Response `200`: one [Plant](#plant-object).

Errors: `401` if the token is missing or invalid; `404` if the plant does not exist, belongs to another user, or the id is not a UUID.

### PATCH /api/v1/plants/:plantId

**Status: Implemented, contract under review.** Auth required. Changes only the fields that are sent; the others stay as they are.

Request (example):

```json
{
  "name": "Kitchen monstera",
  "radiatorDistance": "NEAR"
}
```

Allowed fields and rules are the same as for [`POST /plants`](#post-apiv1plants): `name`, `species`, `lightCondition`, `potSize`, `radiatorDistance`, `speciesId`, `location`, `notes`. All are optional, but at least one must be sent. `speciesId: null` removes the link to the catalog; `location` and `notes` are cleared with `null` or an empty string; no other field can be `null`. `id`, `ownerId`, `createdAt` and `photoUrl` cannot be changed (use the photo endpoints for the photo).

Response `200`: the updated [Plant](#plant-object).

Errors:

| Status | When |
| --- | --- |
| `400` | Empty body, invalid or `null` value, unknown field, or unknown `speciesId` |
| `401` | Token missing or invalid |
| `404` | The plant does not exist, belongs to another user, or the id is not a UUID |

When care schedules exist, changing `lightCondition`, `potSize` or `radiatorDistance` will recalculate the plant's pending tasks (not implemented yet).

### DELETE /api/v1/plants/:plantId

**Status: Implemented, contract under review.** Auth required. Deletes the plant together with its care tasks and care logs.

Response `204` with no body.

Errors: `401`; `404` if the plant does not exist, belongs to another user, or the id is not a UUID.

### GET /api/v1/plants/:plantId/care-history

**Status: Implemented.** Auth required. The care history of one plant, newest first (by `actionDate`).

Response `200`: an array of [CareLog](#carelog-object) objects (empty if there are none).

Errors:

| Status | When |
| --- | --- |
| `401` | Token missing or invalid |
| `404` | The plant does not exist or belongs to another user (the same body in both cases) |

### POST /api/v1/plants/:plantId/care-history

**Status: Implemented.** Auth required. Records one care action for the plant.

Request:

```json
{
  "actionType": "WATERED",
  "notes": "Filtered room-temperature water."
}
```

| Field | Rules |
| --- | --- |
| `actionType` | Required. One of `WATERED`, `FED`, `REPOTTED`, `SOIL_WET`. `DONE` is a task status and is rejected here |
| `notes` | Optional string. Surrounding spaces are trimmed; at most 500 characters. Blank notes are stored as `null` |

No other fields are accepted. `actionDate` is set by the server to the time of the request (UTC).

Response `201`: the created [CareLog](#carelog-object).

Errors:

| Status | When |
| --- | --- |
| `400` | Missing or invalid `actionType`, `notes` too long or not a string, or an unknown field |
| `401` | Token missing or invalid |
| `404` | The plant does not exist or belongs to another user (the same body in both cases) |

### GET /api/v1/care-history

**Status: Implemented.** Auth required. The care history of all plants owned by the current user, newest first (by `actionDate`). Used by the dashboard and the Tasks page.

Response `200`: an array of [CareLog](#carelog-object) objects (empty if there are none). Entries for other users' plants are never included.

Errors: `401` if the token is missing or invalid.

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

### POST /api/v1/feedback

**Status: Implemented, contract under review.** Auth optional. Feedback about the website ("what to change"). Anyone can send it, including from the login page.

- With a valid `Authorization: Bearer` token, the feedback is linked to the user.
- Without a token, or with an expired or invalid one, it is stored anonymously. The request is never rejected because of the token.
- The server also stores the browser's `User-Agent` to help reproduce bugs.

Request:

```json
{
  "category": "IDEA",
  "message": "It would be great to sort plants by the next watering date.",
  "page": "/plants"
}
```

| Field | Required | Rules |
| --- | --- | --- |
| `category` | yes | `BUG`, `IDEA` or `OTHER` |
| `message` | yes | 1–2000 characters after trimming spaces |
| `page` | no | App path starting with `/`, up to 200 characters (not a full URL) |

Response `201`:

```json
{
  "id": "string",
  "createdAt": "2026-11-18T09:30:00.000Z"
}
```

Errors: `400` (invalid category, empty or too long message, invalid `page`, unknown field).

There is no endpoint for reading feedback yet; the team reads the `feedback` table directly (for example with `npx prisma studio`).

### GET /api/v1/me/settings

**Status: Implemented, contract under review.** Auth required. The current user's interface language and reminder settings. A user who never saved settings gets the defaults shown below.

Response `200`:

```json
{
  "language": "en",
  "remindersEnabled": true,
  "reminderTime": "09:00",
  "dayBeforeAlert": false,
  "emailDigest": true
}
```

| Field | Notes |
| --- | --- |
| `language` | `uk` or `en` (lower case, the same codes as the frontend i18n) |
| `remindersEnabled` | Send reminders at all |
| `reminderTime` | When to send the daily reminder: `"HH:MM"`, 24-hour, local time in `Europe/Kyiv` |
| `dayBeforeAlert` | Also remind the day before a task is due |
| `emailDigest` | One daily email with all of the day's tasks |

Errors: `401`.

### PATCH /api/v1/me/settings

**Status: Implemented, contract under review.** Auth required. Changes only the fields that are sent; at least one is required. No field can be `null`.

Request (example):

```json
{
  "language": "uk",
  "reminderTime": "07:45"
}
```

Response `200`: the full settings object, as in `GET`.

Errors: `400` (empty body, unknown field, `null`, `language` other than `uk`/`en`, `reminderTime` not `"HH:MM"` between `00:00` and `23:59`, a boolean sent as a string), `401` (token missing or invalid, or its user no longer exists).

Reminders are not sent yet; these settings are stored for when they are.

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
  "location": "Living room window",
  "notes": null,
  "photoUrl": "/api/v1/uploads/3f2b8c1e6a4d4e0f9b7a1c2d3e4f5a6b.jpg",
  "createdAt": "2026-11-18T09:30:00.000Z"
}
```

The fields follow the `Plant` model in `backend/prisma/schema.prisma`. `lightCondition`, `potSize` and `radiatorDistance` use the [enum values](#enums) above. `speciesId` links to the [species catalog](#species-object), or is `null`. `photoUrl` is the owner's photo (see [Photo files](#photo-files)), or `null`; when it is `null`, the frontend can show the species photo instead.

## Species object

```json
{
  "id": "string",
  "scientificName": "Monstera deliciosa",
  "commonName": "Swiss Cheese Plant",
  "recommendedLight": "BRIGHT_INDIRECT",
  "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/.../640px-....jpg",
  "photoAttribution": "Photo: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons",
  "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:....jpg"
}
```

| Field | Notes |
| --- | --- |
| `scientificName` | Botanical name (genus capitalised, epithet lower case, cultivar in quotes, e.g. `Peperomia obtusifolia 'Golden Gate'`) |
| `commonName` | One name for both interface languages |
| `recommendedLight` | [`LightCondition`](#enums); a good default for the plant's `lightCondition` |
| `photoUrl` | 640 px image on Wikimedia Commons, or `null` (2 of 93 species have no photo). For cultivars it may show the species or genus |
| `photoAttribution`, `photoSourceUrl` | **Required by the photo licences:** whenever `photoUrl` is shown, show `photoAttribution` next to it as a link to `photoSourceUrl` |

The catalog (93 species) is inserted by a data migration. Its source and verification status are described in `backend/prisma/migrations/*_seed_species_catalog/migration.sql`.

## CareLog object

One row of `CareHistory` in `backend/prisma/schema.prisma`. Field names match the database and `CareLog` in `frontend/src/types/plant.ts`:

```json
{
  "id": "string",
  "plantId": "string",
  "careTaskId": null,
  "actionType": "WATERED",
  "actionDate": "2026-11-18T09:30:00.000Z",
  "notes": "Filtered room-temperature water.",
  "createdAt": "2026-11-18T09:30:00.000Z"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (UUID) | |
| `plantId` | string (UUID) | |
| `careTaskId` | string or `null` | The scheduled task this action completed; always `null` until the schedule engine is connected |
| `actionType` | [`CareActionType`](#enums) | Entries created through the API use `WATERED`, `FED`, `REPOTTED` or `SOIL_WET` |
| `actionDate` | string | When the action happened. UTC, ISO 8601 |
| `notes` | string or `null` | |
| `createdAt` | string | UTC, ISO 8601 |
