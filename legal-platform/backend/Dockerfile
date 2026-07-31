# syntax=docker/dockerfile:1

# ---- deps: install once, cached across builds unless package*.json change ----
FROM node:18-bullseye-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- build: generate the Prisma client (needs the schema + full deps) ----
FROM node:18-bullseye-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .

# ---- runtime: smallest layer that can actually run the app ----
FROM node:18-bullseye-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Non-root user — never run the app as root in a container.
RUN groupadd -r nodeapp && useradd -r -g nodeapp nodeapp

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY package.json ./
COPY prisma ./prisma
COPY src ./src

RUN chown -R nodeapp:nodeapp /app
USER nodeapp

EXPOSE 5000

# Prisma migrations run as a separate deploy step (see docker-compose.yml /
# CI workflow) — never auto-migrate on container start, since that races
# with multiple replicas starting at once in a real deployment.
CMD ["node", "src/server.js"]
