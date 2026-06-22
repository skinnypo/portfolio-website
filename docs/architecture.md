# Architecture

## Overview

The portfolio is a self-hosted monorepo with four Docker services communicating over an internal network. The frontend is a **static build** — content is fetched from the database once at build time and baked into the JavaScript bundle. There is no server-side rendering.

```
Browser
  │
  ▼
nginx  (:80)
  ├── /uploads/*  → serve from uploads volume (images)
  ├── /api/*      → proxy to backend:3000
  └── /*          → serve static files from frontend_dist volume

backend  (:3000)  ← Express + Prisma
  └── postgres  (:5432)
```

## Service topology

| Service | Image | Role |
|---|---|---|
| `postgres` | postgres:16-alpine | Primary data store |
| `backend` | custom (node:20-alpine) | REST API + DB access |
| `frontend-builder` | custom (node:20-alpine) | One-shot build container (exits after build) |
| `nginx` | nginx:alpine | Reverse proxy + static file server |

Startup order enforced by Docker Compose health checks:
```
postgres (healthy) → backend (healthy) → frontend-builder (exits OK) → nginx (starts)
```

## Build-time content baking

This is the most important architectural constraint. The frontend does **not** call the API at runtime to load portfolio content. Instead:

1. The `frontend-builder` container starts after `backend` is healthy.
2. `scripts/fetch-content.mjs` connects directly to PostgreSQL and queries `Bio`, `Project`, `Experience`, and `Skill` tables.
3. It writes the result to `src/data/content.json`.
4. Vite bundles `content.json` into the JavaScript output.
5. The built `dist/` is copied to the shared `frontend_dist` Docker volume.
6. `nginx` serves these files indefinitely.

**Implication**: updating content in the database requires a re-build of the `frontend-builder` container to take effect on the live site.

## Data flow diagram

```
                    ┌─────────────────┐
                    │   Admin Panel   │
                    │  /admin (SPA)   │
                    └────────┬────────┘
                             │ PUT/POST/DELETE
                             ▼
                    ┌─────────────────┐
                    │    Backend      │   ← JWT auth required
                    │  /api/admin/*   │
                    └────────┬────────┘
                             │ Prisma ORM
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    └────────┬────────┘
                             │ SQL (direct, at build time only)
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

## Admin API routes (JWT required)

All under `/api/admin/`. See [api.md](api.md) for full reference.

## Frontend routing

React Router v7 handles client-side routing. nginx serves `index.html` for all non-asset paths (SPA fallback):

| Path | Page |
|---|---|
| `/` | Main portfolio (3D scene) |
| `/myworks` | Projects gallery |
| `/play` | Chess game + AI chat |
| `/admin` | Content management panel |

## Shared volumes

| Volume | Content | Used by |
|---|---|---|
| `frontend_dist` | Built React app | frontend-builder (write), nginx (read) |
| `uploads` | User-uploaded images | backend (write), nginx (read) |
| `postgres_data` | Database files | postgres |

## Key dependencies

### Backend
- **Express 4** — HTTP server
- **Prisma 6** — ORM and migration runner
- **Zod** — request body validation on all endpoints
- **jose** — JWT sign/verify
- **argon2** — admin password hashing
- **nodemailer** — Gmail SMTP for contact form

### Frontend
- **React 18** — UI framework
- **Three.js / @react-three/fiber** — 3D WebGL rendering
- **@react-three/drei** — Three.js helpers
- **GSAP** — scroll and animation
- **Lenis** — smooth scroll
- **chess.js** — chess game logic
- **GA4 (gtag.js)** — page analytics, loaded dynamically when `VITE_GA_ID` is set
