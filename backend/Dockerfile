# syntax=docker/dockerfile:1
#
# Vazon backend image (NestJS + Prisma).
# Targets:
#   development  used by docker-compose.yml: source is bind-mounted, `nest start --watch`
#   production   compiled JS + production dependencies only, runs as non-root
# No secrets are baked in: DATABASE_URL and the rest come from the runtime environment.

ARG NODE_IMAGE=node:24.22.3-bookworm-slim

# ---------- base ----------
FROM ${NODE_IMAGE} AS base
# OpenSSL is needed by Prisma's schema engine (migrations).
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- deps: install exactly what package-lock.json says ----------
FROM base AS deps
COPY package.json package-lock.json ./
# The postinstall script runs `prisma generate`, which needs the schema and config.
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# ---------- development ----------
FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3100
# Regenerate the client (schema may have changed), apply pending migrations, start in watch mode.
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev"]

# ---------- build ----------
FROM deps AS build
COPY . .
# The Prisma CLI (a dev dependency) is kept: the production container applies
# migrations on start (see CMD). Everything else for development is pruned.
RUN npm run build \
  && npm prune --omit=dev \
  && npm install --no-save --ignore-scripts prisma@7.10.1

# ---------- production ----------
FROM base AS production
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./
# Photo uploads are written here by the non-root user.
RUN mkdir -p uploads && chown node:node uploads
USER node
EXPOSE 3100
# Apply pending migrations, then start. `migrate deploy` only runs migrations
# that are not applied yet, and never resets data.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
