# Deployment & DevOps

## What's here

- **`backend/Dockerfile`** — multi-stage build (deps → Prisma generate →
  slim runtime), runs as a non-root user, expects `DATABASE_URL` and every
  other backend env var (see `backend/.env.example`) supplied at runtime.
- **`frontend/Dockerfile`** — multi-stage Next.js build using
  `output: "standalone"` (set in `next.config.mjs`) for a small runtime
  image. `NEXT_PUBLIC_*` vars must be passed as **build args**, not just
  runtime env vars — Next.js inlines them into the client bundle at build
  time.
- **`docker-compose.yml`** (repo root) — local dev stack: Postgres, Redis,
  backend, frontend, all wired together with health-checked startup
  ordering. `docker compose up` is the intended one-command local setup
  once `backend/.env` is filled in from `.env.example`.
- **`.github/workflows/ci.yml`** — on every PR: syntax-checks and
  `prisma validate`s the backend, lints and builds the frontend. On merge
  to `main`: builds both Docker images and pushes them to GitHub Container
  Registry (`ghcr.io`).

## What's NOT here, on purpose

**Nothing in this repo deploys anywhere automatically.** The CI workflow
stops at "image built and pushed to a registry" — there is no step that
takes that image and puts it on a server, because that step depends on a
choice this repo can't make for you: which host (Render, Fly.io, AWS
ECS/Fargate, a plain VPS with `docker compose`, etc.), and that choice
determines everything about how the deploy step should actually work
(a `render.yaml`, a Fly `fly.toml`, an ECS task definition, and an SSH
+ `docker compose pull && up -d` script are all completely different).

Also not automated, and genuinely shouldn't be without more infrastructure
than exists here:
- **Database migrations on deploy** — `npx prisma migrate deploy` needs to
  run against production as its own explicit step, not automatically on
  container start (multiple replicas starting simultaneously would race
  to run the same migration). Add this as an explicit CI/CD step once a
  deploy target is chosen.
- **Zero-downtime / rolling deploys** — depends entirely on the chosen
  host's own mechanism for that.
- **Secrets management** — `.env` files are for local dev only. Every
  secret in `backend/.env.example` needs a real secrets manager
  (GitHub Actions secrets are already used for the registry push; a
  production deploy needs its own, e.g. the host's built-in secrets store,
  AWS Secrets Manager, etc.).
- **This sandbox has never run `docker build`** — Docker isn't available
  in the environment this was built in. Both Dockerfiles were written
  carefully (multi-stage, non-root, standalone Next output verified to
  actually produce the files the Dockerfile expects) and the YAML for both
  `docker-compose.yml` and the GitHub Actions workflow was syntax-validated,
  but neither has been run against a real Docker daemon. Test both before
  relying on them.

## Quickest path to an actual deployment

1. Pick a host. For a Node + Postgres app this size, Render or Fly.io are
   the least-setup options (both can build directly from a Dockerfile).
2. Provision managed Postgres (Supabase, as the backend README already
   assumes for `ap-south-1` data localization) and Redis (optional —
   the app runs fine without it, see `backend/src/utils/cache.js`).
3. Set every var from `backend/.env.example` in the host's secret store.
4. Add one more CI job (or the host's own git-push-to-deploy) after
   `build-and-push` that actually deploys the pushed image, plus a
   `npx prisma migrate deploy` step run once against the production
   database before traffic switches over.
