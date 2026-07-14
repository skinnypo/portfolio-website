# Architecture

## Overview

The portfolio is a self-hosted monorepo. In development (`docker-compose.dev.yml`) all five services below, including `nginx`, run in Docker on an internal network. In production (`docker-compose.prod.yml`) only `postgres`, `backend`, `strapi`, and `frontend-builder` run in Docker — `nginx` runs as a native host process instead, proxying to the ports `backend` and `strapi` publish to `127.0.0.1` and serving static files from host-mounted paths (see [deployment.md](deployment.md)). The frontend is a **static build** either way — content is fetched from Strapi's REST API once at build time and baked into the JavaScript bundle. There is no server-side rendering.

```
Browser
  │
  ▼
nginx  (:80)
  ├── /uploads/*  → proxy to strapi:1337 (Strapi media library)
  ├── /cms/*      → proxy to strapi:1337, /cms prefix stripped (admin UI + REST API)
  ├── /api/*      → proxy to backend:3000
  └── /*          → serve static files from frontend_dist volume

backend  (:3000)  ← Express (contact form + AI chat proxy only)
strapi   (:1337)  ← Strapi CMS (content authoring + REST API)

postgres (:5432)  ← two separate databases: `portfolio` (backend's, currently unused — empty Prisma schema) and `strapi` (Strapi's, actively used)
  ├── used by backend  (via `DATABASE_URL`, Prisma CLI only — not connected to at runtime)
  └── used by strapi   (via `STRAPI_DATABASE_URL`, actively read/written)
```

## Service topology

| Service | Image | Role |
|---|---|---|
| `postgres` | postgres:16-alpine | Primary data store (separate `portfolio` and `strapi` databases) |
| `backend` | custom (node:22-alpine) | Contact form + AI chat proxy — no content API |
| `strapi` | custom (node:22-alpine) | Headless CMS — content authoring UI + REST API |
| `frontend-builder` | custom (node:22-alpine) | One-shot build container (exits after build) |
| `nginx` | nginx:alpine | Reverse proxy + static file server — **dev only**; not a service in `docker-compose.prod.yml` |

Startup order enforced by Docker Compose health checks (dev):
```
postgres (healthy) → backend (healthy) & strapi (healthy) → frontend-builder (exits OK, depends on strapi) → nginx (starts)
```

In prod, the order is the same minus `nginx`, which is started/managed independently as a host service.

## Build-time content baking

This is the most important architectural constraint. The frontend does **not** call the API at runtime to load portfolio content. Instead:

1. The `frontend-builder` container starts after `strapi` is healthy.
2. `scripts/fetch-content.mjs` calls Strapi's REST API (`/api/bio`, `/api/projects`, `/api/experiences`, `/api/skills`) using a `Bearer` token from `STRAPI_API_TOKEN`.
3. It writes the result to `src/data/content.json`.
4. Vite bundles `content.json` into the JavaScript output.
5. The built `dist/` is copied to the shared `frontend_dist` Docker volume.
6. `nginx` serves these files indefinitely.

**Implication**: updating content in the database requires a re-build of the `frontend-builder` container to take effect on the live site.

## Data flow diagram

```
                    ┌─────────────────┐
                    │  Strapi Admin   │
                    │  /cms/admin     │   ← Strapi's own auth
                    └────────┬────────┘
                             │ authenticated writes
                             ▼
                    ┌─────────────────┐
                    │  Strapi REST API│
                    │  /cms/api/*     │
                    └────────┬────────┘
                             │ Strapi's own ORM
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │  (strapi db)    │
                    └────────┬────────┘
                             │ HTTP GET, Bearer STRAPI_API_TOKEN
                             │ (build time only)
                             ▼
              ┌──────────────────────────┐
              │  scripts/fetch-content   │  ← runs during Docker build
              │  writes content.json     │
              └──────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  Vite build              │
              │  bundles content.json    │
              └──────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  nginx                   │
              │  serves static files     │
              └──────────────────────────┘
```

## Public API routes (no auth)

| Route | Purpose |
|---|---|
| `GET /api/health` | Docker health check probe |
| `POST /api/contact` | Contact form → Gmail |
| `POST /api/chat` | AI chat → Google Gemini |

## Content API (Strapi)

Content is authored in Strapi's admin UI and read via Strapi's own REST API (`bio`, `projects`, `experiences`, `skills` content types) — not through the Express backend, which has no content routes at all. See [api.md](api.md) for the Strapi API section.

## Frontend routing

React Router v7 handles client-side routing. nginx serves `index.html` for all non-asset paths (SPA fallback):

| Path | Page |
|---|---|
| `/` | Main portfolio (3D scene) |
| `/myworks` | Projects gallery |
| `/play` | Chess game + AI chat |

`/cms/*` and `/uploads/*` are proxied by nginx directly to `strapi` before the SPA fallback — they are not React Router routes.

## Shared volumes

| Volume | Content | Used by |
|---|---|---|
| `frontend_dist` (dev: named volume `frontend_dist_dev`; prod: host bind mount) | Built React app | frontend-builder (write), nginx (read) |
| `strapi_uploads` (dev: named volume `strapi_uploads_dev`; prod: host bind mount) | Strapi media library uploads | strapi (write), nginx (read, via `/uploads/*` proxy) |
| `postgres_data` (dev: named volume `postgres_data_dev`) | Database files | postgres |

## Key dependencies

### Backend
- **Express 4** — HTTP server
- **Prisma 6** — client/migration tooling (schema currently has no models; kept for future use)
- **Zod** — request body validation on all endpoints
- **express-rate-limit** — per-route rate limiting
- **nodemailer** — Gmail SMTP for contact form

### Strapi
- **@strapi/strapi 5** — headless CMS core (admin UI + content API)
- **@strapi/admin** (core) — admin panel auth, configured via `ADMIN_JWT_SECRET` in `strapi/config/admin.ts`
- **pg** — PostgreSQL driver

### Frontend
- **React 18** — UI framework
- **Three.js / @react-three/fiber** — 3D WebGL rendering
- **@react-three/drei** — Three.js helpers
- **GSAP** — scroll and animation
- **Lenis** — smooth scroll
- **chess.js** — chess game logic
- **GA4 (gtag.js)** — page analytics, loaded dynamically when `VITE_GA_ID` is set
