# syntax=docker/dockerfile:1

FROM node:18-bullseye-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-bullseye-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars must be present at build time, not just runtime — they
# get inlined into the client bundle. Pass them as build args in CI/CD.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

FROM node:18-bullseye-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN groupadd -r nodeapp && useradd -r -g nodeapp nodeapp

# Requires `output: "standalone"` in next.config.mjs (see that file) — this
# is what makes the runtime image small (no full node_modules copy needed).
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

RUN chown -R nodeapp:nodeapp /app
USER nodeapp

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
