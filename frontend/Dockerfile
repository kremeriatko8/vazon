# syntax=docker/dockerfile:1
#
# Vazon frontend image (React + Vite).
# Targets:
#   development  used by docker-compose.yml: Vite dev server with hot reload
#   production   static build served by nginx
# VITE_* values are public (they end up in the browser bundle). Never put secrets in them.

ARG NODE_IMAGE=node:24.22.3-bookworm-slim

# ---------- deps ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- development ----------
FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 5180
CMD ["npm", "run", "dev"]

# ---------- build ----------
FROM deps AS build
COPY . .
# The API URL is fixed at build time for a static bundle.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---------- production ----------
FROM nginx:1.30-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
