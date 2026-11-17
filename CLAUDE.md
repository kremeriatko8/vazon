# Vazon: project memory for Claude Code

Vazon is a web application for houseplant care. It gives each plant a personal watering, feeding and repotting schedule, adjusted by season, conditions and owner feedback. The daily entry point is a "Today" view. Tagline: "Houseplant care without the guesswork." Team: three UCU students (OOAD course). Developer roles are not assigned to named people; use Developer 1 (frontend), Developer 2 (backend), Developer 3 (infrastructure).

Reference project Peach is in a separate folder. Never read, modify or copy from it unless the user asks. Do not put Vazon inside Peach.

## Mandatory layout (university requirement)

```
vazon/
├── frontend/      React + Vite + TypeScript + Tailwind CSS + React Router
├── backend/       NestJS + TypeScript + Prisma
├── infra/         infrastructure notes and future AWS docs (README.md only for now)
├── .github/       workflows/ and pull_request_template.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .dockerignore
├── README.md
└── CONTRIBUTING.md
```

Keep frontend, backend and infra clearly separated. No microservices.

## Stack (decided)

- Frontend: React, TypeScript (strict), Vite, Tailwind CSS, React Router, ESLint
- Backend: Node.js, NestJS, TypeScript, REST, class-validator and class-transformer for request validation, Swagger/OpenAPI
- Database: PostgreSQL with Prisma ORM and Prisma migrations
- Local development: Docker and Docker Compose
- Version control: Git, GitHub, feature branches, pull requests, GitHub Actions for basic CI
- Future deployment: AWS (documented in `infra/README.md` only)

Use stable, compatible versions. Record the exact versions actually installed in the README. Do not add libraries without a clear purpose.

## Backend rules

- API under `/api/v1`. Health check: `GET /api/v1/health` returns `{ "status": "ok" }`.
- Feature modules: `auth`, `users`, `plants`, `care-schedules`, `care-history`, plus `prisma` and `common`.
- Controllers stay thin. Business logic lives in services.
- Validation with class-validator DTOs and a global ValidationPipe.
- Swagger at `/api/v1/docs` (or `/docs`, but pick one and document it).
- Never store plain-text passwords. Hash with argon2 or bcrypt.
- Care schedule logic must be a pure, unit-tested function. It takes plant data, season and past events, and returns due dates. Do not hard-code schedule rules beyond the initial placeholders.
- All timestamps are stored in UTC. Display them in `Europe/Kyiv`.

## Frontend rules

- Folders: `src/assets`, `src/components`, `src/pages`, `src/layouts`, `src/hooks`, `src/services`, `src/types`.
- All API calls go through `src/services`. Base URL comes from `VITE_API_URL`. No hard-coded production endpoints.
- Routes (placeholders): `/`, `/login`, `/register`, `/dashboard`, `/plants`, `/plants/new`, `/tasks`. Placeholders must be visibly labelled as "Coming soon" in the UI.
- Visual style: modern botanical SaaS. Colors: sage green, forest green, warm ivory, soft beige, white. Minimal, responsive, mobile-first.

## Database rules

Initial Prisma models (placeholders with real relationships):
- `User`: id, email (unique), passwordHash, createdAt
- `Plant`: id, ownerId, name, species, lightCondition, potSize, radiatorDistance, createdAt
- `CareTask`: id, plantId, taskType, scheduledDate, status
- `CareHistory`: id, plantId, actionType, actionDate, notes

Use proper foreign keys, indexes on foreign keys, and constraints. Do not seed fake production users. Do not claim the business logic is complete.

## Git and collaboration

- `main` is the stable branch. Nobody pushes feature work directly to `main`.
- Branch names: `feature/<short-name>`, for example `feature/frontend-layout`.
- Every change goes through a pull request. Breaking API changes must be announced to the frontend developer.
- Never force-push. Never delete or overwrite existing remote history.

## Commands (target)

- `docker compose up --build`: starts the database, backend and frontend
- `npm run dev` or `pnpm dev` in each app for running it without Docker
- `npx prisma migrate dev`: local migrations
- `npm test`: tests for each app
- `npm run lint`: lint checks for each app

Pick one package manager (npm or pnpm) at the start, and use it consistently.

## Secrets and safety

- Never commit `.env`, secrets, `node_modules` or build artifacts.
- Commit `.env.example` with placeholders only.
- Do not create AWS resources, accounts or paid infrastructure.
- Ask before any destructive operation or unexpected change.

## Out of scope for the initialization phase

Full authentication, scheduling algorithms, reminders, donations, shop features, QR codes, machine learning, photo uploads, AWS deployment.

## Definition of Done

Code merged through a reviewed pull request. Tests pass. Lint passes. The feature was checked in a browser at phone width. README and relevant docs updated.
