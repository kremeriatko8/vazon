# Backlog

Ideas and tasks for later. Nothing here is scheduled or agreed yet. Before work starts, the team discusses the item and records the API in [api.md](api.md).

| Item | Area | Status |
| --- | --- | --- |
| [Sign in with Google](#sign-in-with-google) | auth (backend, frontend, database) | Idea, not discussed |

## Sign in with Google

Let users register and sign in with a Google account, in addition to email and password.

**Why:** fewer steps to start, and no new password to remember.

**What it needs:**

- **Google Cloud:** an OAuth client (Client ID) for the web app. Free; no paid resources.
- **Backend:** an endpoint such as `POST /api/v1/auth/google`. It verifies the Google ID token, then finds or creates the user and returns our own `accessToken`, the same as `POST /auth/login`.
- **Database:** a migration. `User.passwordHash` is required today and must become optional; add a unique field for the Google account id (for example `googleId`).
- **Frontend:** a "Continue with Google" button on `/login` and `/register`.
- **Contract:** the new endpoint in `api.md`, agreed by the team before implementation.

**Open questions:**

- If a Google email matches an existing email-and-password account, do we link the accounts or reject the sign-in?
- Can a Google-only user add a password later?
- Is it in scope for the course, given that full authentication is out of scope for the initial phase (see `CLAUDE.md`)?

**Owner:** not assigned. The auth module belongs to kremeriatko8 in the current split, so the plan should be agreed with her.
