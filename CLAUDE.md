# CLAUDE.md — Project Instructions

This file governs Claude's behavior in this repository. Read it before taking any action.

## Project overview

A self-hosted 3D developer portfolio. Key architectural constraint: **content is baked at build time** — the frontend fetches from Strapi's REST API once during the Docker build and outputs a static JSON file. There is no runtime API call for page content.

## Monorepo layout

```
/                   ← repo root (pnpm workspace)
├── backend/        ← Express + Prisma + PostgreSQL (port 3000)
├── strapi/         ← Strapi CMS (content, admin at /cms/admin)
├── frontend/       ← Vite + React + Three.js (port 5173 dev)
├── nginx/          ← Reverse proxy config — used by dev's Docker nginx service; prod nginx runs natively on the host using this as a reference
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── Makefile        ← all common dev tasks
└── .env            ← single env file for all services
```

## Common commands

Use `make help` to see all targets. The most frequent ones:

```bash
make install        # pnpm install workspace deps
make dev-backend    # tsx watch (requires .env with DATABASE_URL)
make dev-frontend   # vite --host
make up-build       # full Docker rebuild + start
make db-migrate     # prisma migrate dev
make db-seed        # no-op — content and admin credentials now live in Strapi
make db-studio      # Prisma Studio UI
```

## Backend conventions

- **Framework**: Express 4 (Node 22)
- **ORM**: Prisma 6 with PostgreSQL 16
- **Validation**: always use Zod `safeParse` — never trust `req.body` directly
- **Error handling**: every async route handler must wrap its body in `try { ... } catch (err) { next(err) }` — Express 4 does not catch async rejections automatically
- **Error responses**: always `{ error: string }` shape
- **Auth**: none — the backend has no admin routes or auth middleware. All content management now lives in Strapi (`strapi/`), which has its own admin auth at `/cms/admin`.
- **Routes**: `/api/health`, `/api/contact`, `/api/chat` — all public, no auth

## Frontend conventions

- **Framework**: React 18 + TypeScript + Vite
- **3D**: Three.js via `@react-three/fiber` and `@react-three/drei`
- **Routing**: React Router v7 (file-based pages under `src/pages/`)
- **Content**: imported from `src/data/content.json` (generated at build time by `scripts/fetch-content.mjs`) — never fetch content at runtime
- **API calls**: always check `response.ok` before parsing JSON; surface real error messages from `{ error }` responses instead of showing a generic fallback
- **Double-submit prevention**: use `useRef` guards (not state) for async form/chat handlers — state updates are async and can't prevent a second fire synchronously
- **No comments**: only add a comment when the WHY is non-obvious

## Environment variables

Single `.env` at the repo root is shared by all services (Docker reads it via `env_file`). See `.env.example` for all keys. Key groups:

| Prefix | Used by |
|---|---|
| `POSTGRES_*` | Docker postgres service |
| `DATABASE_URL` | Backend Prisma |
| `STRAPI_*` | Strapi service (DB URL, app keys, secrets, API token) |
| `ALLOW_ORIGIN` | Backend CORS |
| `GMAIL_*` | Backend contact route |
| `TURNSTILE_*` | Backend + Frontend (CAPTCHA) |
| `GEMINI_API_KEY` | Backend chat route |
| `VITE_*` | Frontend (baked into JS bundle at build) |

## Docker service order

`postgres` → `backend` (health-checked) and `strapi` (health-checked) → `frontend-builder` (build only, exits, depends on `strapi`) → `nginx` (dev only — see below)

The `frontend-builder` service fetches content from Strapi's REST API, runs the build, and writes static files to the `frontend_dist` shared volume/bind mount. `nginx` serves those files and also proxies `/cms/*` to `strapi`. In `docker-compose.dev.yml`, `nginx` is itself a Docker service; in `docker-compose.prod.yml` there is no `nginx` service at all — it runs as a native host process instead, reading the same bind-mounted build output.

## What NOT to do

- Do not add `console.log` to production code — logs are stripped by Terser in the frontend build
- Do not call backend APIs for content at runtime — use the baked `content.json`
- Do not add error handling for impossible states — trust Express middleware and Prisma types
- Do not create planning or analysis documents unless asked — work from conversation context
- Do not skip Zod validation on any public endpoint
