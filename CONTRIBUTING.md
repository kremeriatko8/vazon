# Contributing to Vazon

This guide covers how the three of us work on Vazon: Developer 1 (frontend), Developer 2 (backend) and Developer 3 (infrastructure). Read it before you open your first pull request.

## Branch naming

Create every branch from an up-to-date `main`:

| Prefix | Use it for | Example |
| --- | --- | --- |
| `feature/<short-name>` | New functionality | `feature/plant-create` |
| `fix/<short-name>` | Bug fixes | `fix/login-redirect` |
| `docs/<short-name>` | Documentation only | `docs/api-contract` |

Use short names in lowercase, with words separated by hyphens.

## Workflow

1. Never push directly to `main`. `main` is the stable branch.
2. Make each change on its own branch and open a pull request against `main`.
3. Keep pull requests small: one feature or one endpoint per PR. Small PRs are faster to review and easier to revert.
4. Never force-push, and never rewrite history that is already on the remote.

## Before opening a pull request

Run these in each app you changed (`frontend/`, `backend/` or both):

```bash
npm run lint
npm test
npm run build
```

For `backend/`, also run:

```bash
npx prisma validate
```

If you changed `backend/prisma/schema.prisma`, also create a migration with `npx prisma migrate dev` and check that it applies to a fresh database.

Fill in every section of the pull request template.

## Review

- At least one teammate must review and approve a pull request before it is merged.
- The author merges after approval and a green CI run.
- Reviewers check behaviour, tests and docs, not only style.

## Breaking API changes

A breaking change is one that removes or renames an endpoint, field or enum value, or changes a response shape. If your PR makes one:

1. Update [`docs/api.md`](docs/api.md) in the same pull request.
2. Describe it under **Breaking changes** in the PR description and tell the frontend developer (Developer 1).

## API contract

Some features need both the frontend and the backend. Before you implement one, agree on the endpoint, the request shape and the response shape in [`docs/api.md`](docs/api.md). Merge the contract change first, or in the same PR, so that both sides build against the same definition.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary in imperative mood>
```

Common types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`.

Examples:

```
feat(plants): add plant creation endpoint
fix(frontend): show error message when login fails
docs: describe care schedule rules
```

## Secrets

- Never commit `.env` or any file with real credentials.
- Put placeholders in `.env.example` and update it whenever you add a new variable.
- If a secret is committed by accident, tell the team at once so it can be rotated. Do not try to hide it by rewriting history.

## Dependency updates

- Do not run `npm audit fix --force`. It can silently install breaking major versions or downgrades.
- Add or upgrade a dependency only for a clear reason, and say why in the PR.
- Report any `npm audit` advisories in the pull request: what is affected, whether it is production or dev-only, and the plan.

## Work order

Build features in this order, so that each step depends only on finished work:

1. Docs and CI
2. Database models and migration
3. Auth
4. Plants
5. Care schedules and care tasks
6. History and notifications

## Branch protection (for maintainers)

A repository maintainer sets these up manually on GitHub, under **Settings → Branches → Branch protection rules** for `main`:

- Require a pull request before merging
- Require the CI workflow (`frontend` and `backend` jobs) to pass before merging
- Require at least one approval
